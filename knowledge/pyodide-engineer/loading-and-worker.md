# Loading Pyodide 314.0.8 in a module Web Worker

Why this matters for pyodide-engineer: the live NLTK box runs real Python in the visitor's browser. Pyodide
must load off the main thread, from a pinned CDN version, and the 314 line changed how workers must be
created. Getting this wrong means a blank box or a frozen page.

## Version facts (checked 2026-11-26)
- Latest Pyodide: 314.0.8 (changelog date 2026-11-13). Bundled Python: 3.14.2. Platform
  `emscripten_5_0_3`, ABI `2026_0` (from pyodide-lock.json).
- The version number now tracks the Python version (0.28 was Python 3.13; 314.x is Python 3.14). This is
  inferred from the changelog, not stated as a policy.
- Breaking changes in 314.0.0 that affect us:
  - `pyodide.asm.js` became `pyodide.asm.mjs`: Pyodide is ES-module only.
  - Classic (non-module) workers are no longer supported; `importScripts()` loading is out.
  - Bundlers and service workers need updated imports/config.
  - `ssl` is a stub and OpenSSL hashes are gone from `hashlib` (not used by our NLTK code).
  - Standard library is no longer split out; `fullstdlib` option is deprecated and ignored.

## CDN and files
- jsDelivr base (indexURL): `https://cdn.jsdelivr.net/pyodide/v314.0.8/full/`.
- Core files: `pyodide.mjs` (loader exporting `loadPyodide`), `pyodide.asm.mjs` (Emscripten JS),
  `pyodide.asm.wasm` (the interpreter), `python_stdlib.zip`, `pyodide-lock.json` (package index).
- Never use the `dev` channel in production; it changes on every commit.
- `debug/` variant has unminified `pyodide.asm.mjs` for debugging only.

## loadPyodide options
| Option | Default | Use here |
|---|---|---|
| `indexURL` | folder of `pyodide.mjs` | leave default when importing from the CDN |
| `packages` | none | pass `["nltk"]` to load during bootstrap (more efficient than a later call) |
| `stdout` / `stderr` | console | route to a debug log; never to the visible page unescaped |
| `lockFileURL` | `${indexURL}/pyodide-lock.json` | leave default |
| `checkAPIVersion` | true | keep: catches loader/runtime mismatch |

## Worker shape (from the official web worker page, adapted)
1. Worker file is an ES module that imports `loadPyodide` from the pinned CDN `pyodide.mjs` URL.
2. Start loading once at module top level: `const ready = loadPyodide({ packages: ["nltk"] })`.
3. On each message `{ id, text }`: `await ready`, run the analysis, `postMessage({ id, result })` or
   `postMessage({ id, error })`.
4. Main thread (project layout): the worker is a static file served from the site's `/nlp/` folder,
   created with `new Worker("/nlp/nltk-worker.js", { type: "module" })`. `type: "module"` is required
   with 314.x. (A Vite-bundled worker via `new URL(..., import.meta.url)` would also work.)
5. Match replies to requests by an incrementing `id`; remove one-shot listeners after use.

## Startup sequence for the NLP box
1. Show "Loading Python (first time only)..." with a progress hint; keep the textarea usable.
2. `loadPyodide({ packages: ["nltk"] })` (loads nltk 3.9.4 and its dependency regex).
3. Fetch the project's nltk_data zip and unpack it into the in-memory FS (see the packages note).
4. Fetch the shared `nltk_core.py` text and run it once to define functions (`runPythonAsync`).
5. Post a "ready" message; enable the Analyze button.
6. For each request, call the Python function with the text passed as a global or argument, never by
   pasting user text into Python source.

## Running code
- `pyodide.runPython(code)` is synchronous; `runPythonAsync(code, { globals })` allows top-level await.
- Imports must be loaded first (`packages`, `loadPackage`, or `loadPackagesFromImports(code)`).
- `pyodide.globals.get("analyze")` returns a PyProxy for a Python function you can call from JS.
- Safe input passing: `pyodide.globals.set("user_text", text)` then run a fixed snippet, or call the
  function proxy with the string; strings convert implicitly.

## Interrupting long runs (optional)
- `pyodide.setInterruptBuffer(sharedBuffer)`; writing 2 (SIGINT) into it raises KeyboardInterrupt.
- Needs a SharedArrayBuffer, which needs cross-origin isolation headers (COOP/COEP). That conflicts with
  loading from the jsDelivr CDN unless CORP/CORS headers line up; UNVERIFIED for this site. Simpler: cap
  input length (for example 5,000 characters) and terminate/recreate the worker on timeout.

## Pitfalls
- Loading Pyodide on the main thread freezes the page during startup.
- Mixing versions: the loader, wasm and lock file must all be 314.0.8; pin one constant.
- Reloading Pyodide per request: load once per worker, reuse.
- `loadPackage` the same package twice is generally not allowed; guard with a flag.

## Sources
- https://pyodide.org/en/stable/project/changelog.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/webworker.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/downloading-and-deploying.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/api/js-api.html (accessed 2026-11-26)
- https://cdn.jsdelivr.net/pyodide/v314.0.8/full/pyodide-lock.json (accessed 2026-11-26)
