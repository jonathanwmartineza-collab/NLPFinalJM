// The on-device AI engine: capability check, consented download, one WebLLM engine in a Web Worker,
// streaming with Stop and a stall watchdog. A mock engine with the same behaviour is used when
// VITE_MOCK_ENGINE=1 (tests and local development without a GPU).
import { useSyncExternalStore } from 'react';
import { TIERS, tierById, modelIdFor, recommendTier, type TierId } from './models';
import { mockReply } from './mock';

export type EngineStatus = 'checking' | 'unsupported' | 'idle' | 'loading' | 'ready' | 'error' | 'elsewhere';
export type EngineState = {
  status: EngineStatus;
  reason?: string;            // why unsupported / error (plain language)
  errorKind?: 'oom' | 'network' | 'device' | 'other';
  f16: boolean;
  memGb?: number;
  mobile: boolean;
  recommended: TierId;
  tier?: TierId;              // loaded or loading tier
  modelId?: string;
  progress: number;           // 0..1
  progressText: string;
  cached: Partial<Record<TierId, boolean>>;
  storage?: { usedMb: number; quotaMb: number };
};
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ChatOptions = { maxTokens: number; temperature?: number; json?: boolean };
export class EngineError extends Error { constructor(public code: string, message: string) { super(message); } }

const MOCK = import.meta.env.VITE_MOCK_ENGINE === '1';
const STALL_MS = 90_000;
const LOCK = 'brainyapp2-ai-engine';
const PREF = 'ba2.tier';

let state: EngineState = { status: 'checking', f16: false, mobile: false, recommended: 'balanced', progress: 0, progressText: '', cached: {} };
const subs = new Set<() => void>();
const set = (p: Partial<EngineState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
export const getEngineState = () => state;
export function useEngine(): EngineState {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getEngineState, getEngineState);
}
export const savedTier = (): TierId | undefined => { try { return (tierById(localStorage.getItem(PREF) ?? '')?.id); } catch { return undefined; } };

// ---------- capability ----------
let inited = false;
export async function initEngine(): Promise<void> {
  if (inited) return; inited = true;
  const ua = navigator.userAgent;
  const mobile = (navigator as any).userAgentData?.mobile ?? /Mobi|Android|iPhone|iPad/i.test(ua);
  const memGb: number | undefined = (navigator as any).deviceMemory;
  const nogpu = MOCK && new URLSearchParams(location.search).has('nogpu');
  let f16 = MOCK;
  if (!MOCK || nogpu) {
    const gpu = (navigator as any).gpu;
    if (!gpu || nogpu) return set({ status: 'unsupported', mobile, memGb, reason: 'This browser does not offer WebGPU, which the free on-device AI needs.' });
    try {
      const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return set({ status: 'unsupported', mobile, memGb, reason: 'WebGPU is present but no compatible graphics adapter was found (it may be turned off or blocked).' });
      f16 = adapter.features.has('shader-f16');
    } catch {
      return set({ status: 'unsupported', mobile, memGb, reason: 'WebGPU could not start on this device.' });
    }
  }
  set({ status: 'idle', f16, mobile, memGb, recommended: recommendTier(memGb, mobile), cached: await cachedTiers(f16) });
  refreshStorage();
}

async function cachedTiers(f16: boolean): Promise<Partial<Record<TierId, boolean>>> {
  const out: Partial<Record<TierId, boolean>> = {};
  if (MOCK) { for (const t of TIERS) out[t.id] = localStorage.getItem(`mock.cached.${t.id}`) === '1'; return out; }
  try {
    if (!('caches' in self)) return out;
    const c = await caches.open('webllm/model');
    const keys = (await c.keys()).map((r) => r.url);
    for (const t of TIERS) out[t.id] = keys.some((k) => k.includes(`/${modelIdFor(t, f16)}/`));
  } catch { /* cache API unavailable */ }
  return out;
}

async function refreshStorage() {
  try {
    const e = await navigator.storage?.estimate?.();
    if (e?.quota) set({ storage: { usedMb: Math.round((e.usage ?? 0) / 1e6), quotaMb: Math.round(e.quota / 1e6) } });
  } catch { /* not available */ }
}

// ---------- loading ----------
type Engine = {
  chat: { completions: { create: (req: any) => Promise<AsyncIterable<any>> } };
  interruptGenerate: () => void; unload: () => Promise<void>; resetChat?: () => Promise<void>;
};
let engine: Engine | null = null;
let worker: Worker | null = null;
let releaseLock: (() => void) | null = null;
let loadSeq = 0;

async function takeLock(): Promise<boolean> {
  const locks = (navigator as any).locks;
  if (!locks?.request || releaseLock) return true;
  return new Promise<boolean>((resolve) => {
    locks.request(LOCK, { ifAvailable: true }, (lock: unknown) => {
      if (!lock) { resolve(false); return; }
      resolve(true);
      return new Promise<void>((r) => { releaseLock = () => { releaseLock = null; r(); }; });
    });
  });
}

function classify(e: unknown): Pick<EngineState, 'errorKind' | 'reason'> {
  const m = String((e as Error)?.message ?? e).toLowerCase();
  if (/out of memory|oom|allocation|exceed|too large|maxbuffersize|max_buffer/.test(m)) return { errorKind: 'oom', reason: 'Your device ran out of graphics memory for this model.' };
  if (/fetch|network|failed to load|404|quota|storage/.test(m)) return { errorKind: 'network', reason: 'The model download failed or storage is full. Check your connection and free space, then try again.' };
  if (/device|lost|gpu/.test(m)) return { errorKind: 'device', reason: 'The graphics device stopped responding.' };
  return { errorKind: 'other', reason: 'The AI could not start on this device.' };
}

export async function loadTier(id: TierId): Promise<void> {
  const tier = tierById(id); if (!tier) return;
  if (state.status === 'loading') return;
  if (!(await takeLock())) return set({ status: 'elsewhere', reason: 'The AI is already running in another tab or window of this browser. Close it there, then reload this page.' });
  const seq = ++loadSeq;
  const modelId = modelIdFor(tier, state.f16);
  set({ status: 'loading', tier: id, modelId, progress: 0, progressText: 'Starting…', reason: undefined, errorKind: undefined });
  try { localStorage.setItem(PREF, id); } catch { /* storage blocked */ }
  try { await (navigator.storage as any)?.persist?.(); } catch { /* not granted: fine */ }
  try {
    await unloadEngine(false);
    if (MOCK) {
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => setTimeout(r, 40));
        if (seq !== loadSeq) return;
        set({ progress: i / 10, progressText: `Fetching model: ${Math.round(tier.sizeGb * 100 * i)} MB of ${Math.round(tier.sizeGb * 1000)} MB` });
      }
      localStorage.setItem(`mock.cached.${id}`, '1');
      engine = mockEngine();
    } else {
      const webllm = await import('@mlc-ai/web-llm');
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      engine = (await webllm.CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: (p: { progress: number; text: string }) => { if (seq === loadSeq) set({ progress: p.progress, progressText: p.text }); },
      })) as unknown as Engine;
    }
    if (seq !== loadSeq) return;
    set({ status: 'ready', progress: 1, progressText: '', cached: { ...state.cached, [id]: true } });
  } catch (e) {
    if (seq !== loadSeq) return;
    await unloadEngine(true);
    set({ status: 'error', ...classify(e) });
  }
  refreshStorage();
}

/** Cancel a download in progress (terminates the worker; partial files may stay in the cache). */
export async function cancelLoad() {
  loadSeq++;
  await unloadEngine(true);
  set({ status: 'idle', progress: 0, progressText: '' });
}

async function unloadEngine(release: boolean) {
  try { await engine?.unload(); } catch { /* ignore */ }
  engine = null;
  worker?.terminate(); worker = null;
  if (release) releaseLock?.();
}

/** Remove every downloaded model from this browser. */
export async function deleteModels() {
  await cancelLoad();
  releaseLock?.();
  try {
    if (MOCK) TIERS.forEach((t) => localStorage.removeItem(`mock.cached.${t.id}`));
    else for (const n of await caches.keys()) if (n.startsWith('webllm')) await caches.delete(n);
  } catch { /* ignore */ }
  set({ cached: {}, tier: undefined, modelId: undefined });
  refreshStorage();
}

// ---------- generation ----------
let running = false;
export async function chat(messages: ChatMessage[], opts: ChatOptions, onText: (t: string) => void, signal?: AbortSignal): Promise<{ text: string; finish: string }> {
  if (!engine || state.status !== 'ready') throw new EngineError('not_ready', 'Turn on the AI first.');
  if (running) throw new EngineError('busy', 'The AI is still answering. Wait for it, or press Stop.');
  running = true;
  const eng = engine;
  let text = '', finish = 'stop', stalled = false;
  let timer = setTimeout(() => { stalled = true; eng.interruptGenerate(); }, STALL_MS);
  const bump = () => { clearTimeout(timer); timer = setTimeout(() => { stalled = true; eng.interruptGenerate(); }, STALL_MS); };
  const onAbort = () => eng.interruptGenerate();
  signal?.addEventListener('abort', onAbort);
  try {
    await eng.resetChat?.();
    const stream = await eng.chat.completions.create({
      messages, stream: true, max_tokens: opts.maxTokens, temperature: opts.temperature ?? 0.6,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    });
    for await (const chunk of stream) {
      const c = chunk.choices?.[0];
      const d: string = c?.delta?.content ?? '';
      if (d) { text += d; onText(d); bump(); }
      if (c?.finish_reason) finish = c.finish_reason;
    }
  } catch (e) {
    const k = classify(e);
    if (k.errorKind === 'device' || k.errorKind === 'oom') { await unloadEngine(true); set({ status: 'error', ...k }); }
    throw new EngineError(k.errorKind ?? 'other', k.reason ?? 'The AI stopped unexpectedly.');
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', onAbort); running = false;
  }
  if (stalled) throw new EngineError('stalled', 'The AI stopped responding. Reload the page to restart it.');
  if (signal?.aborted) finish = 'aborted';
  return { text, finish };
}

function mockEngine(): Engine {
  let stop = false;
  return {
    interruptGenerate: () => { stop = true; },
    unload: async () => {},
    resetChat: async () => {},
    chat: { completions: { create: async (req: any) => {
      stop = false;
      const reply = mockReply(req.messages, !!req.response_format);
      return (async function* () {
        for (let i = 0; i < reply.length; i += 12) {
          if (stop) { yield { choices: [{ delta: { content: '' }, finish_reason: 'abort' }] }; return; }
          await new Promise((r) => setTimeout(r, 12));
          yield { choices: [{ delta: { content: reply.slice(i, i + 12) } }] };
        }
        yield { choices: [{ delta: { content: '' }, finish_reason: 'stop' }] };
      })();
    } } },
  };
}
