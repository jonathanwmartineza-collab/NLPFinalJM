# Pyodide packages, file system and JS/Python conversion

- Source: Packages built in Pyodide — https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
- Publisher: Pyodide project
- Licence: MPL-2.0 · Copy in repo: link only

Why this matters for pyodide-engineer: NLTK is available in Pyodide but its data is not; the data has to
arrive as a zip and land where NLTK looks. Results then have to cross back to JavaScript without leaking
proxies or breaking `postMessage`.

## Which packages exist (Pyodide 314.0.8 package list)
| Package | In Pyodide? | Version | Notes |
|---|---|---|---|
| nltk | yes | 3.9.4 | wheel `nltk-3.9.4-py3-none-any.whl`, depends on `regex` |
| regex | yes | 2026.3.32 | loaded automatically as nltk's dependency |
| spacy | no | - | also absent: thinc, blis, srsly, cymem, preshed, murmurhash |
- Consequence: spaCy can only run at build time; the browser shows spaCy's results from static JSON.
- nltk 3.9.4 in Pyodide equals the build pin, so the shared NLTK core gives identical numbers on both
  sides (a good acceptance test).

## Loading packages
- `pyodide.loadPackage(nameOrNames, { messageCallback, errorCallback, checkIntegrity })` returns a
  promise of loaded package data. Accepts a name, a URL, or an array.
- Dependencies of official Pyodide packages load automatically (nltk pulls regex).
- `checkIntegrity` defaults to true: downloads are verified against the lock file. Keep it on.
- `loadPackagesFromImports(code)` scans code for imports of Pyodide-built packages.
- `micropip.install()` handles PyPI pure-Python wheels and resolves deps; not needed here because nltk
  is a built-in Pyodide package. A custom wheel URL needs CORS and a valid wheel filename.
- Use `messageCallback` to drive a loading message. (The project passes `messageCallback: () => {}` to
  silence package logs and reports its own named steps through `io.progress` instead.)

## File system
- Default FS is MEMFS: in memory, gone on reload. Fine for nltk_data (re-fetched; the browser HTTP cache
  makes repeat visits fast).
- `pyodide.FS` is the Emscripten FS API (`writeFile`, `readFile`, `mkdirTree`, `mount`, `syncfs`).
- Python sees the same files through `open`, `pathlib`, etc.
- Persistence options (not needed): IDBFS mount + `syncfs`; `mountNativeFS` (Chromium only).

## Getting nltk_data in: unpackArchive
- JS: `const buf = await (await fetch(zipUrl)).arrayBuffer();`
  `pyodide.unpackArchive(buf, "zip", { extractDir: "/nltk_data" });`
- Formats are those of Python's `shutil.unpack_archive` (zip, tar, wheel...). `extractDir` defaults to
  the working directory.
- Python alternative: `from pyodide.http import pyfetch`, `await (await pyfetch(url)).unpack_archive()`.
- Then in Python, before any NLTK call: `import nltk; nltk.data.path.insert(0, "/nltk_data")`.
- Expected tree inside the zip: `tokenizers/punkt_tab/english/...`, `corpora/stopwords/english`,
  `sentiment/vader_lexicon.zip` (left zipped: NLTK reads through the `.zip` path component).
- Fetch the zip from the same origin (the site's `/nlp/` folder) so CSP `connect-src 'self'` covers it.

## Converting results back to JavaScript
- Immutable values convert implicitly: int/float to Number (big ints to BigInt), str to String,
  bool to Boolean, None to undefined.
- dict and list come back as PyProxy objects, which cannot go through `postMessage` (structured clone).
- `proxy.toJs({ dict_converter: Object.fromEntries })` gives plain objects. Pass `dict_converter`
  explicitly: the docs are inconsistent about whether the default is Map or Object.
- Python side: `pyodide.ffi.to_js(obj, depth=-1, pyproxies=None, create_pyproxies=True,
  dict_converter=None, default_converter=None, eager_converter=None)`; the ffi page says dicts become
  plain objects by default; `dict_converter=js.Map.new` for Map.
- Destroy proxies when done (`proxy.destroy()`), or collect them via `toJs({ pyproxies })` and destroy
  each; or use `using` blocks where supported.
- Simplest robust pattern for this project: Python returns `json.dumps(result)` (a str), JS does
  `JSON.parse`. Strings convert implicitly, nothing to destroy, and the shape matches the static JSON.

## Checklist
- [ ] `py.loadPackage('nltk')` succeeds (the project loads it after `loadPyodide`);
      `pyodide.runPython("import nltk; nltk.__version__")` returns "3.9.4".
- [ ] nltk_data zip unpacked; `nltk.data.find("tokenizers/punkt_tab/english/")` does not raise.
- [ ] Results cross as JSON strings; no PyProxy reaches `postMessage`.
- [ ] Same input gives the same numbers as the build's JSON.

## Sources
- https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/loading-packages.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/api/js-api.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/file-system.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/accessing-files.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/type-conversions.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/api/python-api/ffi.html (accessed 2026-11-26)
- https://cdn.jsdelivr.net/pyodide/v314.0.8/full/pyodide-lock.json (accessed 2026-11-26)
