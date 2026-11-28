# Loading Pyodide 314.0.8 in a module Web Worker

- Source: Using Pyodide in a web worker — https://pyodide.org/en/stable/usage/webworker.html (accessed 2026-11-26)
- Publisher: Pyodide project
- Licence: MPL-2.0 · Copy in repo: link only

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
| `indexURL` | folder of `pyodide.mjs` | the project passes `PYODIDE_CDN` explicitly, because boot.ts is shared with the Node test (which may pass a local `PYODIDE_INDEX`) |
| `packages` | none | docs: loading here during bootstrap is more efficient; the project instead calls `loadPackage('nltk')` right after, in parallel with its own data fetches |
| `stdout` / `stderr` | not stated (docs prefer `setStdout()` / `setStderr()`) | route to a debug log; never to the visible page unescaped |
| `lockFileURL` | `${indexURL}/pyodide-lock.json` | leave default |
| `checkAPIVersion` | true | keep: catches loader/runtime mismatch |

## Worker shape
- Official web worker page: "Pyodide requires a module-type worker because pyodide.asm.mjs is an ES
  module. Classic workers using importScripts() are not supported."
Docs example: an ES-module worker that imports `loadPyodide` from the pinned CDN `pyodide.mjs` and starts
`loadPyodide()` at top level. The project's actual layout:
1. Main thread (web/src/nlp/client.ts): `new Worker(new URL('./nltk.worker.ts', import.meta.url),
   { type: 'module' })`, a Vite-bundled module worker, created lazily on the first `send()`.
2. Worker (web/src/nlp/nltk.worker.ts): on the first message it calls `boot()` from
   web/src/nlp/boot.ts, which dynamic-imports `${PYODIDE_CDN}pyodide.mjs` (`PYODIDE_VERSION = '314.0.8'`).
   A failed boot resets the promise so the visitor can retry.
3. Messages are `{ id, fn, args }` with `fn` in `analyze`, `coach`, `agreement` (or `boot`); replies are
   `{ id, ok, result, ms }` or `{ id, ok: false, error }`; progress steps come as `{ id: 0, progress }`.
4. Replies are matched to requests by an incrementing `id` in a `pending` map.

## Startup sequence for the NLP box (boot.ts)
1. The page shows "Loading NLTK in your browser: <step>…" with the progress step names.
2. `loadPyodide({ indexURL: PYODIDE_CDN })`.
3. In parallel: `py.loadPackage('nltk')` (pulls regex), fetch `/nlp/nltk_data.zip`, `/nlp/nltk_core.py`
   and `/nlp/topic-index.json`.
4. `unpackArchive` the zip into `/nltk_data`; `FS.mkdirTree('/home/pyodide/nlp')` and `FS.writeFile` the
   core module there.
5. `py.globals.set('INDEX_JSON', index)` then `py.runPython(GLUE)` (synchronous): puts the paths in
   place, imports `nltk_core`, defines `_call(fn, args_json)` and warms VADER with `sentiment("warm up")`.
6. Each request calls the `_call` proxy with `JSON.stringify(args)`; user text travels as data, never
   pasted into Python source, and the result comes back as a JSON string for `JSON.parse`.

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
