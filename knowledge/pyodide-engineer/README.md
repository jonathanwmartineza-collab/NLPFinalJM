# Knowledge index: pyodide-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Pyodide 314.0.8 = Python 3.14.2; ES-module only: create the worker with `{ type: "module" }` (classic workers fail).
- The app (web/src/nlp/boot.ts, nltk.worker.ts): dynamic `import()` of the pinned jsDelivr `v314.0.8/full/pyodide.mjs`, `loadPyodide({ indexURL: PYODIDE_CDN })`, then `py.loadPackage('nltk')` in parallel with fetching the data zip, `nltk_core.py` and `topic-index.json`.
- nltk 3.9.4 and regex 2026.3.32 are Pyodide packages; spaCy is not (build-time only).
- NLTK data: fetch `/nlp/nltk_data.zip`, `unpackArchive(buf, "zip", { extractDir: "/nltk_data" })`, then `nltk.data.path.insert(0, "/nltk_data")`.
- Return results as JSON strings; never post a PyProxy; destroy proxies you create.
- CSP (meta tag in web/index.html, as of 2026-11-26): `'wasm-unsafe-eval'` plus `https://cdn.jsdelivr.net` in script-src and connect-src are already present; never `'unsafe-eval'`.
- Load only after the visitor's click; measure and show the first-load size.

## Notes
- [Loading Pyodide in a module Web Worker](loading-and-worker.md): version facts, CDN files, loadPyodide options, worker shape, startup sequence. Read before writing the worker.
- [Packages, file system and JS/Python conversion](packages-fs-ffi.md): package list, loadPackage, MEMFS, unpackArchive, toJs/to_js. Read when wiring data and results.
- [CSP, download size and pitfalls](csp-size-and-pitfalls.md): current site CSP, required changes, size, test tips, checklist. Read before shipping.
- [NLP final architecture](../_shared/nlp-final-architecture.md): where each part runs, file map, owners.
- [Web and LLM application security](../_shared/llm-and-web-security.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-26.
