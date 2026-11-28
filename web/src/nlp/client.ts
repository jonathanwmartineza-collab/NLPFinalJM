// Main-thread side of the live NLTK worker. Nothing is downloaded until the visitor presses a button.
import { useEffect, useState } from 'react';
import type { Fn } from './boot';

export type NltkState = { status: 'idle' | 'loading' | 'ready' | 'error'; step: string; error: string; bootMs: number };
let state: NltkState = { status: 'idle', step: '', error: '', bootMs: 0 };
const subs = new Set<(s: NltkState) => void>();
const set = (p: Partial<NltkState>) => { state = { ...state, ...p }; subs.forEach((f) => f(state)); };

/** Longest wait for the first load (about 15 MB) and for one NLTK call. A worker that does not answer in time is
 * stopped, so a stalled download or a runaway call never leaves a spinner on screen for ever. */
export const TIMEOUTS = { bootMs: 300_000, callMs: 60_000 };

let worker: Worker | null = null;
let seq = 0;
type Pending = { ok: (v: any) => void; fail: (e: Error) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<number, Pending>();

/** Stops the worker and fails every waiting call, so the next call starts a fresh worker. */
function reset(err: Error) {
  const w = worker; worker = null;
  pending.forEach((p) => { clearTimeout(p.timer); p.fail(err); }); pending.clear();
  w?.terminate();
}

function getWorker() {
  if (worker) return worker;
  const w = new Worker(new URL('./nltk.worker.ts', import.meta.url), { type: 'module' });
  worker = w;
  w.onmessage = (e) => {
    if (w !== worker) return; // a message from a worker that was already stopped
    const m = e.data;
    if (m.progress) { set({ step: m.progress }); return; }
    const p = pending.get(m.id); if (!p) return; pending.delete(m.id); clearTimeout(p.timer);
    m.ok ? p.ok(m) : p.fail(new Error(m.error));
  };
  w.onerror = (e) => {
    // A dead worker (for example its file is gone after a redeploy, or the visitor is offline) fails every
    // waiting call and is dropped, so "Try again" starts a fresh one instead of posting to the dead one.
    if (w !== worker) return;
    const err = new Error(e.message || 'The NLTK worker failed to start. Check your connection and try again.');
    reset(err);
    set({ status: 'error', error: err.message });
  };
  return w;
}

function send(fn: Fn | 'boot', args?: unknown): Promise<any> {
  const id = ++seq;
  return new Promise((ok, fail) => {
    const ms = fn === 'boot' ? TIMEOUTS.bootMs : TIMEOUTS.callMs;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      const err = new Error(fn === 'boot'
        ? `Loading Python and NLTK took more than ${Math.round(ms / 1000)} seconds, so it was stopped. Check your connection and try again.`
        : `NLTK took more than ${Math.round(ms / 1000)} seconds on this text, so it was stopped. Try a shorter text.`);
      reset(err);
      // After a stopped boot the visitor sees the error; after a stopped call NLTK simply reloads on the next click.
      set(fn === 'boot' ? { status: 'error', error: err.message, step: '' } : { status: 'idle', step: '' });
    }, ms);
    pending.set(id, { ok, fail, timer });
    try { getWorker().postMessage({ id, fn, args }); } catch (e) { pending.delete(id); clearTimeout(timer); fail(e as Error); }
  });
}

let booting: Promise<void> | null = null;
/** Load Pyodide + NLTK once (about 15 MB the first time, then cached by the browser). Concurrent callers share one load. */
export function startNltk(): Promise<void> {
  if (state.status === 'ready' && worker) return Promise.resolve();
  if (booting) return booting;
  set({ status: 'loading', step: 'Starting', error: '' });
  booting = send('boot')
    .then((m) => { set({ status: 'ready', step: '', bootMs: m.ms }); })
    .catch((e: Error) => {
      // A half-loaded Pyodide cannot be loaded again in the same worker: start the next try from a fresh one.
      reset(e);
      set({ status: 'error', error: e.message, step: '' });
      throw e;
    })
    .finally(() => { booting = null; });
  return booting;
}

export async function runNltk<T = any>(fn: Fn, args: unknown): Promise<{ result: T; ms: number }> {
  await startNltk();
  const m = await send(fn, args);
  return { result: m.result as T, ms: m.ms };
}

export function useNltk() {
  const [s, setS] = useState(state);
  useEffect(() => { subs.add(setS); setS(state); return () => { subs.delete(setS); }; }, []);
  return s;
}

/** For tests: the current state, and a clean slate between tests. */
export const _test = { state: () => state, reset: () => { reset(new Error('reset')); booting = null; state = { status: 'idle', step: '', error: '', bootMs: 0 }; } };

// Results of nlp/nltk_core.py (see that file for the meaning of each field). `note` is "" unless the input was cut
// to the size limit, had no words, or does not look like English.
export type Sent = { neg: number; neu: number; pos: number; compound: number; label: 'positive' | 'negative' | 'neutral' };
export type Analysis = { counts: Record<string, number>; top_words: [string, number][]; collocations: [string, string, number, number][];
  sentiment: Sent; sentences: (Sent & { text: string })[]; note?: string };
export type Coach = { score: number; vague: { word: string; count: number; tip: string }[]; hedges: string[];
  checks: { id: string; ok: boolean; label: string; tip: string }[]; sentiment: Sent; keywords: [string, number][];
  topics: string[]; experts: { slug: string; name: string; title: string; score: number }[]; sharper: string; note?: string };
export type AgreementMap = { experts: { name: string; terms: string[]; unique: string[]; sentiment: Sent; recommends: string[] }[];
  shared: [string, string[]][]; pairs: { a: string; b: string; overlap: number; tone_gap: number; conflict: boolean; same_pick?: boolean; verdict: string; note?: string }[];
  note?: string };
