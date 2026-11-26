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
  errorKind?: 'oom' | 'network' | 'storage' | 'device' | 'other';
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
/** json: a JSON Schema string for grammar-constrained output (WebLLM needs the schema; see SPEC_JSON_SCHEMA). */
export type ChatOptions = { maxTokens: number; temperature?: number; json?: string };
export class EngineError extends Error { constructor(public code: string, message: string) { super(message); } }

const MOCK = import.meta.env.VITE_MOCK_ENGINE === '1';
const STALL_MS = 90_000;
const LOCK = 'brainyapp2-ai-engine';
const PREF = 'ba2.tier';

let state: EngineState = { status: 'checking', f16: false, mobile: false, recommended: 'quality', progress: 0, progressText: '', cached: {} };
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
  // Storage first: a full disk reports "QuotaExceededError", which must not read as a graphics-memory problem.
  if (/quota|storage|no space|disk full/.test(m)) return { errorKind: 'storage', reason: 'This browser has no room left to save the model. Free some disk space or use “Free up space” in Clear options, then try again.' };
  if (/out of memory|oom|allocation|too large|maxbuffersize|max_buffer|exceeds? (the )?(device|buffer|limit)/.test(m)) return { errorKind: 'oom', reason: 'Your device ran out of graphics memory for this model.' };
  if (/fetch|network|failed to load|404|timed? ?out|connection/.test(m)) return { errorKind: 'network', reason: 'The model download was interrupted. Check your connection and try again: parts already downloaded are kept.' };
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
  // Ask for persistent storage but never wait for the answer: Firefox shows a permission prompt and keeps the
  // promise pending until the visitor answers it, which used to freeze the download at 0%.
  try { void Promise.resolve((navigator.storage as any)?.persist?.()).catch(() => {}); } catch { /* not available */ }
  try {
    await unloadEngine(false);
    if (MOCK) {
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => setTimeout(r, 40));
        if (seq !== loadSeq) return;
        // Test hooks: ?mockfail=network|quota fails the first download halfway (a retry then succeeds).
        const fail = new URLSearchParams(location.search).get('mockfail');
        if (i === 5 && fail && !sessionStorage.getItem('mockfail.done')) { sessionStorage.setItem('mockfail.done', '1'); throw new Error(fail === 'quota' ? 'QuotaExceededError: storage quota exceeded' : 'Failed to fetch model shard (network error)'); }
        set({ progress: i / 10, progressText: `Fetching model: ${Math.round(tier.sizeGb * 100 * i)} MB of ${Math.round(tier.sizeGb * 1000)} MB` });
      }
      localStorage.setItem(`mock.cached.${id}`, '1');
      engine = mockEngine();
    } else {
      const webllm = await import('@mlc-ai/web-llm');
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      engine = (await webllm.CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: (p: { progress: number; text: string }) => { if (seq === loadSeq) set({ progress: p.progress, progressText: p.text }); },
      }, tier.chatOpts as any)) as unknown as Engine;
    }
    if (seq !== loadSeq) return;
    set({ status: 'ready', progress: 1, progressText: '', cached: { ...state.cached, [id]: true } });
  } catch (e) {
    if (seq !== loadSeq) return;
    console.warn('[BrainyApp2] model load error:', e);
    await unloadEngine(true);
    set({ status: 'error', ...classify(e) });
  }
  refreshStorage();
}

/** Cancel a download in progress (terminates the worker; partial files may stay in the cache). */
export async function cancelLoad() {
  loadSeq++;
  await unloadEngine(true);
  // Only a device that can run the AI goes back to "idle"; unsupported or not-yet-checked devices keep their status.
  if (['loading', 'ready', 'error', 'elsewhere'].includes(state.status)) set({ status: 'idle', progress: 0, progressText: '' });
  else set({ progress: 0, progressText: '' });
}

async function unloadEngine(release: boolean) {
  // An answer in progress ends now with a clear message instead of waiting on a worker that is going away.
  if (running) { engine?.interruptGenerate(); killRun?.(new EngineError('unloaded', 'The AI was turned off while answering. Turn it on again to continue.')); }
  try { await Promise.race([engine?.unload(), new Promise((r) => setTimeout(r, 3_000))]); } catch { /* ignore */ }
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

/** Whether the loaded model can use grammar-constrained JSON (the Studio falls back to plain text when not). */
export const jsonSupported = () => (state.tier ? tierById(state.tier)?.json !== false : true);

// ---------- repetition guard ----------
// A backstop, not the fix: small models can fall into a loop ("explicitly explicitly …") and run to the length cap.
// Returns the length of text to keep when the tail is looping, or -1.
export function loopCut(text: string): number {
  const n = text.length;
  // 1. The same chunk (6–400 characters) repeated three times in a row at the end.
  for (let p = 6; p <= 400 && p * 3 <= n; p++) {
    const a = text.slice(n - p);
    if (!/\p{L}{2}/u.test(a)) continue; // only words loop; table rules and indentation repeat legitimately
    if (text.slice(n - 2 * p, n - p) === a && text.slice(n - 3 * p, n - 2 * p) === a) {
      let start = n - 3 * p; // walk back to the first copy and keep just that one
      while (start >= p && text.slice(start - p, start) === a) start -= p;
      return start + p;
    }
  }
  // 2. The same line (20+ characters) three times within the last 12 lines.
  const lines = text.split('\n');
  const recent = lines.slice(-12).map((l) => l.trim()).filter((l) => l.length >= 20);
  const seen = new Map<string, number>();
  for (const l of recent) { seen.set(l, (seen.get(l) ?? 0) + 1); if (seen.get(l)! >= 3) { const first = text.indexOf(l, text.length - lines.slice(-12).join('\n').length); return text.indexOf('\n', first) > 0 ? text.indexOf('\n', first) : first + l.length; } }
  // 3. Very low variety in the last 150 words (the same few phrases in rotation).
  const words = text.slice(-1500).toLowerCase().split(/\s+/).filter(Boolean).slice(-150);
  if (words.length >= 150) {
    const grams = new Set<string>();
    for (let i = 0; i + 2 < words.length; i++) grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    if (grams.size / (words.length - 2) < 0.3) { const cut = text.lastIndexOf('\n\n', n - 600); return cut > n / 3 ? cut : -1; }
  }
  return -1;
}

// ---------- generation ----------
let running = false;
let runDone: Promise<void> = Promise.resolve();
let runAborted = false;
/** Ends the current generation at once (used when the engine is unloaded or hangs). */
let killRun: ((e: EngineError) => void) | null = null;
/**
 * Qwen3 opens every answer with an empty "<think>\n\n</think>" block even with thinking turned off: hide it,
 * and anything inside it. Visible text only grows, so it can be streamed as deltas.
 */
export function stripThink(raw: string): string {
  const t = raw.trimStart();
  if (t.startsWith('<think>')) { const end = t.indexOf('</think>'); return end < 0 ? '' : t.slice(end + 8).trimStart(); }
  return '<think>'.startsWith(t) ? '' : raw;
}

export async function chat(messages: ChatMessage[], opts: ChatOptions, onText: (t: string) => void, signal?: AbortSignal): Promise<{ text: string; finish: string }> {
  if (!engine || state.status !== 'ready') throw new EngineError('not_ready', 'Turn on the AI first.');
  // A previous answer that was stopped (for example by switching experts) may still be winding down: wait briefly.
  if (running && runAborted) await Promise.race([runDone, new Promise((r) => setTimeout(r, 3_000))]);
  if (running) throw new EngineError('busy', 'The AI is still answering. Wait for it, or press Stop.');
  if (!engine || state.status !== 'ready') throw new EngineError('not_ready', 'Turn on the AI first.');
  running = true; runAborted = false;
  let finishRun!: () => void; runDone = new Promise<void>((r) => { finishRun = r; });
  const eng = engine;
  let raw = '', text = '', finish = 'stop', stalled = false, looped = false, checked = 0;
  const tier = state.tier ? tierById(state.tier) : undefined;
  const killed = new Promise<never>((_, rej) => { killRun = rej; });
  killed.catch(() => { /* handled by the race below */ });
  // Watchdog: no token for STALL_MS → interrupt; if the worker does not react within 5 s, end the run anyway.
  const onStall = () => { stalled = true; eng.interruptGenerate(); setTimeout(() => killRun?.(new EngineError('stalled', 'The AI stopped responding. Reload the page to restart it.')), 5_000); };
  let timer = setTimeout(onStall, STALL_MS);
  const bump = () => { clearTimeout(timer); timer = setTimeout(onStall, STALL_MS); };
  const onAbort = () => { runAborted = true; eng.interruptGenerate(); };
  if (signal?.aborted) onAbort();
  signal?.addEventListener('abort', onAbort);
  try {
    await Promise.race([eng.resetChat?.(), killed]);
    const stream = await Promise.race([eng.chat.completions.create({
      messages, stream: true, max_tokens: opts.maxTokens, temperature: opts.temperature ?? 0.6,
      ...(tier?.request ?? {}),
      ...(opts.json && tier?.json !== false ? { response_format: { type: 'json_object', schema: opts.json } } : {}),
    }), killed]);
    const it = stream[Symbol.asyncIterator]();
    for (;;) {
      const step = await Promise.race([it.next(), killed]);
      if (step.done) break;
      const chunk = step.value;
      const c = chunk.choices?.[0];
      const d: string = c?.delta?.content ?? '';
      if (looped) continue; // let the interrupted stream wind down, ignoring its last tokens
      if (d) {
        raw += d; bump();
        const vis = stripThink(raw);
        if (vis.length > text.length) { onText(vis.slice(text.length)); text = vis; }
      }
      if (c?.finish_reason) finish = c.finish_reason;
      if (!opts.json && text.length - checked >= 24) {
        checked = text.length;
        const cut = loopCut(text);
        if (cut >= 0) { looped = true; text = text.slice(0, cut).trimEnd(); eng.interruptGenerate(); }
      }
    }
  } catch (e) {
    if (e instanceof EngineError) throw e; // killed: unloaded or hung
    console.warn('[BrainyApp2] generation error:', e);
    if (/context.?window|exceeds? .*context|prompt.*too long|ContextWindowSizeExceeded/i.test(String((e as Error)?.message ?? e)))
      throw new EngineError('too_long', 'This message and the chat so far are too long for the on-device AI. Shorten the message, or clear the chat and ask again.');
    const k = classify(e);
    if (k.errorKind === 'device' || k.errorKind === 'oom') { await unloadEngine(true); set({ status: 'error', ...k }); }
    throw new EngineError(k.errorKind ?? 'other', k.errorKind === 'other' ? 'The AI stopped unexpectedly. Please try again.' : k.reason ?? 'The AI stopped unexpectedly.');
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', onAbort); running = false; killRun = null; finishRun();
  }
  if (stalled) throw new EngineError('stalled', 'The AI stopped responding. Reload the page to restart it.');
  if (looped) finish = 'repeat';
  else if (signal?.aborted) finish = 'aborted';
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
      const last = String([...req.messages].reverse().find((m: any) => m.role === 'user')?.content ?? '');
      return (async function* () {
        // Test hooks: [[hang]] freezes like a stuck worker; [[fail:device]] loses the GPU mid-answer.
        // [[hang]] freezes once per tab session, so a retry after a reload ("Ask again") gets a normal answer.
        if (last.includes('[[hang]]') && !sessionStorage.getItem('mock.hung')) { sessionStorage.setItem('mock.hung', '1'); yield { choices: [{ delta: { content: 'Starting… ' } }] }; await new Promise(() => {}); }
        for (let i = 0; i < reply.length; i += 12) {
          if (i >= 48 && last.includes('[[fail:device]]')) throw new Error('GPU device was lost');
          if (stop) { yield { choices: [{ delta: { content: '' }, finish_reason: 'abort' }] }; return; }
          await new Promise((r) => setTimeout(r, 12));
          yield { choices: [{ delta: { content: reply.slice(i, i + 12) } }] };
        }
        yield { choices: [{ delta: { content: '' }, finish_reason: 'stop' }] };
      })();
    } } },
  };
}
