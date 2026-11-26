# Pyodide on this site: CSP, download size and pitfalls

Why this matters for pyodide-engineer: the site already ships a strict Content-Security-Policy as a meta
tag in the HTML entry file. Pyodide needs WebAssembly and a cross-origin CDN, so the policy must be
widened exactly as far as needed and no further. First-load weight must be disclosed to visitors.

## What the current site policy allows (read from web/index.html on 2026-11-26)
- `script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net`: WebAssembly allowed and the CDN
  loader can be imported.
- `worker-src 'self' blob:`: same-origin workers allowed. The project's worker is
  web/src/nlp/nltk.worker.ts, bundled by Vite and served from the site's own origin.
- `connect-src 'self'` plus Hugging Face and raw.githubusercontent.com hosts (WebLLM) and
  `https://cdn.jsdelivr.net` (Pyodide wasm, stdlib, lock file and wheels).

## CSP facts (MDN)
- Without `'wasm-unsafe-eval'` (or `'unsafe-eval'`) in `script-src`, WebAssembly is blocked from loading
  and running. Prefer `'wasm-unsafe-eval'`; `'unsafe-eval'` also allows `eval()` and must stay out.
- `worker-src` governs creating Worker scripts; if absent it falls back to `child-src`, then
  `script-src`, then `default-src`.

## Changes the policy needed (both now present in web/index.html as of 2026-11-26)
| Directive | Add | Why |
|---|---|---|
| `script-src` | `https://cdn.jsdelivr.net` | worker imports `pyodide.mjs` and `pyodide.asm.mjs` from the CDN |
| `connect-src` | `https://cdn.jsdelivr.net` | fetch of the wasm, stdlib zip, lock file and package wheels |
| `worker-src` | nothing new | worker script itself is same-origin |
- Narrow it further with a path if desired: `https://cdn.jsdelivr.net/pyodide/v314.0.8/`.
- UNVERIFIED: whether a document's meta-tag CSP applies inside a same-origin module worker, or whether
  the worker gets its policy from its own response headers. Test in Chrome and Firefox with DevTools
  open; look for CSP violations in both the page and the worker console.
- UNVERIFIED (not in Pyodide docs): exactly which loads go through `connect-src` vs `script-src`
  (wasm streaming compile uses fetch). The two additions above cover both cases.
- Alternative avoiding a third-party host: self-host the core files and the nltk/regex wheels under
  `/pyodide/`. The docs say any static host works if it sends the right wasm MIME type and CORS headers.
  Costs repo/deploy size; not the decided architecture.

## Download size on first load
- The full distribution tarball is "200+ MB", but a page downloads only the core plus requested
  packages, not the whole tarball.
- UNVERIFIED: exact first-load bytes for core + nltk + regex on 314.0.8 (docs give no per-file sizes).
  Measure in DevTools Network (transfer size, cache disabled) and write the number on the page.
- Project data adds the trimmed nltk_data zip (English punkt_tab, English stopwords, VADER lexicon):
  192,016 B as built on 2026-11-26 (the full packages are 4.3 MB + 38 KB + 90 KB zipped before
  trimming), plus nltk_core.py and topic-index.json (61,016 B).
- The page tells visitors "about 15 MB the first time, then cached" (web/src/nlp/ui.tsx, client.ts);
  that figure is still UNVERIFIED until measured as described above.
- Repeat visits come from the browser HTTP cache (jsDelivr is versioned and cacheable).
- UX rule: load Pyodide only when the visitor opens or uses the live box, never on page load; show the
  approximate size and a progress message.

## Testing tips
- Playwright can run the live box in Chromium; first run downloads from the CDN, so allow a long
  timeout (for example 120 s) and mark it NOT RUN if the network is blocked rather than skipping silently.
- In unit tests, test the shared NLTK core in CPython instead of Pyodide; same nltk version
  (tests/python/test_nltk_core.py).
- The project also runs the real browser code path in Node: tests/node/pyodide-nltk.mjs imports
  web/src/nlp/boot.ts, boots Pyodide (jsDelivr, or `PYODIDE_INDEX` for a local copy) and asserts parity
  with the CPython build's nltk.json sample.

## Pitfalls checklist
- [ ] Worker created with `{ type: "module" }` (classic workers fail on 314.x).
- [ ] One pinned version string for the CDN URL, used everywhere.
- [ ] No `'unsafe-eval'` added; only `'wasm-unsafe-eval'`.
- [ ] User text passed as data (global or argument), never concatenated into Python source.
- [ ] Input length capped; worker can be terminated and recreated on timeout.
- [ ] Errors shown as friendly text with a retry button; technical detail only in the console.
- [ ] Panel labeled "NLTK (running live in your browser via Pyodide)".

## Sources
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src (accessed 2026-11-26)
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/downloading-and-deploying.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/faq.html (accessed 2026-11-26; no CSP or size guidance there)
- https://pyodide.org/en/stable/usage/webworker.html (accessed 2026-11-26)
- https://www.nltk.org/nltk_data/ (accessed 2026-11-26)
