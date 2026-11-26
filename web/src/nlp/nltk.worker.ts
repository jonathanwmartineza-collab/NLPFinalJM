/// <reference lib="webworker" />
// Live NLTK in the browser: Pyodide (from jsDelivr) runs nlp/nltk_core.py in this module worker, off the main thread.
import { boot, PYODIDE_CDN, type Fn } from './boot';

let ready: ReturnType<typeof boot> | null = null;
const post = (m: unknown) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<{ id: number; fn: Fn | 'boot'; args?: unknown }>) => {
  const { id, fn, args } = e.data;
  const t0 = performance.now();
  try {
    ready ??= boot({
      loadPyodide: async (o) => (await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`)).loadPyodide(o),
      indexURL: PYODIDE_CDN,
      text: async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.text(); },
      bytes: async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.arrayBuffer(); },
      progress: (step) => post({ id: 0, progress: step }),
    });
    const call = await ready;
    const result = fn === 'boot' ? null : call(fn, args);
    post({ id, ok: true, result, ms: Math.round(performance.now() - t0) });
  } catch (err) {
    if (fn === 'boot') ready = null; // allow a retry after a failed download
    post({ id, ok: false, error: String((err as Error)?.message ?? err) });
  }
};
