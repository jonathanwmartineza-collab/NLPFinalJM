---
name: "pyodide-nltk"
description: "Use when building or debugging the NLP Lab's live NLTK box (Pyodide v314.0.8 from jsDelivr in a Web Worker, an nltk_data zip unpacked into Pyodide's file system, nlp/nltk_core.py run in the browser): produces the worker, its message protocol, the consent-first loading UI states, load-time measurements and the CSP needs."
---
# Pyodide + NLTK in the browser

## Purpose
The live box on `/nlp` runs real NLTK in the visitor's browser: Pyodide (CPython compiled to WebAssembly)
loads in a Web Worker, installs `nltk`, unpacks a small `nltk_data.zip` into its virtual file system and
imports the same `nlp/nltk_core.py` the build uses. No server, no Netlify Functions. spaCy is not run here.

## Procedure
1. **Files the build must publish** (owned with python-build-engineer):
   - `web/public/nlp/nltk-worker.js` (the worker, plain JS, no bundler needed)
   - `web/public/nlp/nltk_core.py` (copied from `nlp/nltk_core.py` by `build_nlp.py`, never edited by hand)
   - `web/public/nlp/nltk_data.zip` with `tokenizers/punkt_tab/english/`, `corpora/stopwords/english` and
     `sentiment/vader_lexicon.zip` only; target under 1 MB. Record its SHA-256 in `web/public/nlp/meta.json`.
2. **Consent first.** Nothing loads until the visitor presses a button that states the download
   (Pyodide runtime + NLTK, several MB, from cdn.jsdelivr.net). The rest of the page works from static JSON.
3. **Worker** (`nltk-worker.js`):
   ```js
   const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/";
   importScripts(PYODIDE + "pyodide.js");
   let ready;
   async function boot() {
     const t0 = performance.now();
     const py = await loadPyodide({ indexURL: PYODIDE });
     await py.loadPackage(["nltk"]);                       // regex comes with it
     const zip = await (await fetch("/nlp/nltk_data.zip")).arrayBuffer();
     py.unpackArchive(zip, "zip", { extractDir: "/nltk_data" });
     py.FS.writeFile("/home/pyodide/nltk_core.py", await (await fetch("/nlp/nltk_core.py")).text());
     py.runPython("import nltk, sys; nltk.data.path.insert(0, '/nltk_data'); sys.path.insert(0, '/home/pyodide')");
     const core = py.pyimport("nltk_core");
     postMessage({ type: "ready", ms: Math.round(performance.now() - t0),
                   nltk: py.runPython("import nltk; nltk.__version__") });
     return { py, core };
   }
   onmessage = async ({ data }) => {
     try {
       ready ??= boot();
       const { core } = await ready;
       if (data.type !== "analyze") return;
       const t0 = performance.now();
       const out = core.analyze(String(data.text).slice(0, 5000)).toJs({ dict_converter: Object.fromEntries });
       postMessage({ type: "result", id: data.id, ms: Math.round(performance.now() - t0), result: out });
     } catch (e) {
       postMessage({ type: "error", id: data?.id, message: String(e?.message ?? e).slice(0, 300) });
     }
   };
   ```
   Messages in: `{type: "analyze", id, text}`. Out: `ready`, `result`, `error`. One worker per tab; terminate
   it when the page unmounts.
4. **Version parity.** Pyodide bundles its own `nltk` build; read its version from the `ready` message and
   compare with `nltk==3.9.4` in `requirements.txt`. If they differ, either record both in the UI footnote or
   install the exact version with `micropip.install("nltk==3.9.4")` (adds files.pythonhosted.org to the CSP).
   Decide once, write it down in the build report.
5. **UI states** (frontend-engineer builds them): idle (button + size) → loading (progress text, cancel) →
   ready → running → result (panel labelled "NLTK · live in your browser") → error (message + retry + "the
   static results above still work"). Input capped at 5,000 characters; output escaped as text, never HTML.
6. **CSP** (devops-engineer edits `netlify.toml`): `script-src` adds `https://cdn.jsdelivr.net` and
   `'wasm-unsafe-eval'`; `connect-src` adds `https://cdn.jsdelivr.net`; `worker-src 'self'`. Test the headers
   on a deploy preview, not only on `vite dev`.
7. **Measure** first: cold boot (cache empty), warm boot (cached), one analyze call on a 100-word text. Write
   the numbers, browser and network next to them. Targets: cold ready ≤ 30 s on broadband desktop, analyze
   ≤ 2 s once ready.

## Checklist
- [ ] Nothing is fetched from jsDelivr before the visitor's click.
- [ ] Worker, `nltk_core.py` copy and `nltk_data.zip` are produced by the build and served from `/nlp/`.
- [ ] Pyodide URL pinned to v314.0.8; NLTK version in Pyodide recorded and compared with the build's.
- [ ] Every error path posts an `error` message; the UI shows retry and keeps the static panels usable.
- [ ] Results rendered as text; input length capped; worker terminated on unmount.
- [ ] CSP allows jsDelivr scripts, WebAssembly compile and the worker; checked on a deploy.
- [ ] Load and run times measured and written down with the device used.

## Output template
```
## Live NLTK box: <summary>
Pyodide: v314.0.8 (jsDelivr) · NLTK in Pyodide: <version> (build: 3.9.4) · nltk_data.zip: <KB>, sha256 <first 12>
Timings (<browser>, <network>): cold ready <s> · warm ready <s> · analyze(100 words) <ms>
States checked: idle / loading / ready / result / error → <each PASS or NOT RUN>
CSP: <directives added> · checked on <deploy URL or NOT RUN>
```
