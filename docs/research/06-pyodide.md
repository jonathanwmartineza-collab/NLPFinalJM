# 06 — Pyodide: running NLTK in the browser

## What Pyodide is
Pyodide is CPython compiled to **WebAssembly**, plus a package manager for prebuilt wheels. It runs real
Python inside the browser (or Node), with a JavaScript ↔ Python bridge. Version **314.0.8**
(2026-11-13) ships **Python 3.14.2** (`abi_version 2026_0`, `emscripten_5_0_3`).

## Loading from the CDN
- Official CDN base: `https://cdn.jsdelivr.net/pyodide/v314.0.8/full/` (browser-cached).
- In a **module** Web Worker:
  ```js
  import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/pyodide.mjs";
  const pyodideReady = loadPyodide();               // start once, reuse the promise
  ```
- The full distribution is "200+ MB", but the browser downloads **only what is loaded**: the core plus the
  packages you ask for. Self-hosting is possible from the GitHub release (needs correct WASM MIME type and
  CORS), but the CDN is simpler for this project.

## Packages: `loadPackage`
- `await pyodide.loadPackage(["nltk"])` installs prebuilt wheels from the distribution. Dependencies
  listed in the lock file come along (nltk → `regex`). `loadPackagesFromImports(code)` is an alternative.
- `loadPackage` can install only Pyodide-built packages or wheel URLs, **without dependency resolution**
  for URLs; compatibility is only checked at import time.

| Package | In Pyodide 314.0.8? | Version / file |
|---|---|---|
| **nltk** | **Yes** | 3.9.4, `nltk-3.9.4-py3-none-any.whl` (~1.2 MB), depends on `regex` |
| regex | Yes | 2026.3.32, `cp314 … pyemscripten_2026_0_wasm32` wheel (~0.2 MB) |
| **spacy** | **No** | not in the packages list or `pyodide-lock.json` (nor `thinc`, `blis`) |

## Running in a Web Worker (required here)
- Pyodide's docs say it **requires a module-type worker** (`pyodide.asm.mjs` is an ES module); classic
  workers using `importScripts()` are **not supported**. So:
  `new Worker(new URL("./nltk.worker.ts", import.meta.url), { type: "module" })` (as built: `web/src/nlp/client.ts`).
- Pattern from the docs: initialise once; on each message `{ id, python, context }` run code with
  `runPythonAsync` and reply `{ id, result }` or `{ id, error }`; the main thread matches replies by id.
- Why a worker: loading and running Python never blocks typing, scrolling or the chat UI.
- Our worker will expose fixed functions (`analyse(text)`), not run arbitrary code sent from the page.

## Virtual file system and NLTK data
- `pyodide.FS` is Emscripten's in-memory file system (`MEMFS` always works; `IDBFS` etc. exist).
- `pyodide.unpackArchive(buffer, format, { extractDir })` unpacks a `zip`, `tar`, `gztar`, `bztar`
  or `wheel` buffer into a folder.
- Plan: fetch `/nlp/nltk_data.zip` (English `punkt_tab` + `stopwords` + `vader_lexicon`, built at deploy
  time) → `unpackArchive(buf, "zip", { extractDir: "/nltk_data" })` → in Python
  `nltk.data.path.insert(0, "/nltk_data")`. No `nltk.download()` in the browser.
- `vader_lexicon` must stay as `sentiment/vader_lexicon.zip` (NLTK reads it *inside* the zip) or be
  unpacked to the same relative path — the build script must keep NLTK's expected layout.

## Content Security Policy
- Compiling WebAssembly needs `'wasm-unsafe-eval'` in `script-src` (or the broader `'unsafe-eval'`).
- The app's current CSP `<meta>` already has `script-src 'self' 'wasm-unsafe-eval'` and
  `worker-src 'self' blob:` (for WebLLM), so a same-origin worker file is allowed.
- A `<meta>` CSP on the page does not govern a same-origin worker's own fetches/imports; the worker gets
  its policy from its own HTTP response headers, and Netlify currently sends no CSP header for `/*`.
  If a CSP header is ever added for `/nlp/*`, it must allow `https://cdn.jsdelivr.net` in `script-src`
  and `connect-src` plus `'wasm-unsafe-eval'`. (Worker CSP inheritance is from the CSP Level 3 spec;
  MDN's `script-src` page did not cover workers → treat as **to be tested in the browser**.)

## Memory and first-load cost (measured from the 314.0.8 distribution files)
| File | Size (uncompressed) |
|---|---|
| `pyodide.asm.wasm` | 9.6 MB |
| `python_stdlib.zip` | 2.5 MB |
| `pyodide.asm.mjs` | 1.25 MB |
| nltk + regex wheels | 1.45 MB |
| our `nltk_data.zip` (English subset) | ~0.4 MB (estimate: 248 KB punkt English + 38 KB stopwords + 90 KB VADER) |
| **Total first visit** | **~15 MB** before HTTP compression; cached afterwards |

- The team measured nltk 3.9.4 + regex loading in **~2 s from local files in Node**; in a browser over the
  network add download time (seconds on broadband). Show a progress message and load only when the user
  opens the NLTK tab.
- Memory: a Pyodide instance typically uses tens to low hundreds of MB of WASM memory — fine on desktop,
  acceptable on modern phones; terminate the worker when the user leaves `/nlp`. (No official figure found
  → **UNVERIFIED**.)
- WebLLM may already be holding GPU/RAM on the same tab; keep the two independent.

## Sources
- Pyodide in a web worker — https://pyodide.org/en/stable/usage/webworker.html (accessed 2026-11-26)
- Pyodide JS API (`loadPackage`, `unpackArchive`, `FS`) — https://pyodide.org/en/stable/usage/api/js-api.html (accessed 2026-11-26)
- Downloading and deploying Pyodide — https://pyodide.org/en/stable/usage/downloading-and-deploying.html (accessed 2026-11-26)
- Packages built in Pyodide — https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
- Pyodide changelog (314.x, Python 3.14.2) — https://pyodide.org/en/stable/project/changelog.html (accessed 2026-11-26)
- MDN CSP `script-src` (`wasm-unsafe-eval`) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src (accessed 2026-11-26)
- Local measurement of the Pyodide 314.0.8 distribution (`pyodide-lock.json`, file sizes), 2026-11-26.
- UNVERIFIED: the Pyodide downloading page does not mention CSP; jsDelivr was not reachable from the
  research sandbox, so CDN transfer sizes (compressed) were not measured.
