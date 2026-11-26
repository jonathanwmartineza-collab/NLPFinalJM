// Main-thread side of the live NLTK worker. Nothing is downloaded until the visitor presses a button.
import { useEffect, useState } from 'react';
import type { Fn } from './boot';

export type NltkState = { status: 'idle' | 'loading' | 'ready' | 'error'; step: string; error: string; bootMs: number };
let state: NltkState = { status: 'idle', step: '', error: '', bootMs: 0 };
const subs = new Set<(s: NltkState) => void>();
const set = (p: Partial<NltkState>) => { state = { ...state, ...p }; subs.forEach((f) => f(state)); };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { ok: (v: any) => void; fail: (e: Error) => void }>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./nltk.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.progress) { set({ step: m.progress }); return; }
    const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
    m.ok ? p.ok(m) : p.fail(new Error(m.error));
  };
  worker.onerror = (e) => {
    // A dead worker (for example its file is gone after a redeploy) fails every waiting call and is dropped,
    // so "Try again" starts a fresh one instead of posting to the dead one.
    const err = new Error(e.message || 'The NLTK worker failed to start.');
    pending.forEach((p) => p.fail(err)); pending.clear();
    worker?.terminate(); worker = null;
    set({ status: 'error', error: err.message });
  };
  return worker;
}
function send(fn: Fn | 'boot', args?: unknown): Promise<any> {
  const id = ++seq;
  return new Promise((ok, fail) => { pending.set(id, { ok, fail }); getWorker().postMessage({ id, fn, args }); });
}

/** Load Pyodide + NLTK once (about 15 MB the first time, then cached by the browser). */
export async function startNltk() {
  if (state.status === 'ready') return;
  if (state.status !== 'loading') set({ status: 'loading', step: 'Starting', error: '' });
  try { const m = await send('boot'); set({ status: 'ready', step: '', bootMs: m.ms }); }
  catch (e) { set({ status: 'error', error: (e as Error).message }); throw e; }
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

// Results of nlp/nltk_core.py (see that file for the meaning of each field).
export type Sent = { neg: number; neu: number; pos: number; compound: number; label: 'positive' | 'negative' | 'neutral' };
export type Analysis = { counts: Record<string, number>; top_words: [string, number][]; collocations: [string, string, number, number][];
  sentiment: Sent; sentences: (Sent & { text: string })[] };
export type Coach = { score: number; vague: { word: string; count: number; tip: string }[]; hedges: string[];
  checks: { id: string; ok: boolean; label: string; tip: string }[]; sentiment: Sent; keywords: [string, number][];
  topics: string[]; experts: { slug: string; name: string; title: string; score: number }[]; sharper: string };
export type AgreementMap = { experts: { name: string; terms: string[]; unique: string[]; sentiment: Sent; recommends: string[] }[];
  shared: [string, string[]][]; pairs: { a: string; b: string; overlap: number; tone_gap: number; conflict: boolean; verdict: string }[] };
