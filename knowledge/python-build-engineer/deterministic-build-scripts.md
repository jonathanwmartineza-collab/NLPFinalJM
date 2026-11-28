# Deterministic, loud-failing NLP build scripts

- Source: zipfile — Work with ZIP archives — https://docs.python.org/3/library/zipfile.html (accessed 2026-11-28)
- Publisher: Python Software Foundation
- Licence: PSF-2.0 · Copy in repo: link only

Why this matters for python-build-engineer: the build script's JSON is what examiners see. If the same
commit can produce different numbers, or a broken step silently writes empty JSON and the deploy still
goes live, the final test fails in a way nobody notices until grading.

## Principles
- Same inputs + same pinned versions = byte-identical output.
- Any failure exits non-zero, which fails the Netlify build and keeps the previous good deploy live.
- The script logs what it used: Python, nltk, spaCy and model versions, input file count, output sizes.

## Determinism checklist
- [ ] Pin exact versions in requirements.txt (nltk, spaCy patch, model wheel URL); no `>=`.
- [ ] Read inputs in sorted order (`sorted(Path(...).glob(...))`), never directory order.
- [ ] Sort every list you emit that has no natural order (for example ties in counts: sort by
      `(-count, word)`).
- [ ] Round floats before writing. The project: VADER scores to 3 places, likelihood ratio to 2, spaCy
      topic-index weights to 3.
- [ ] Serialise the same way every time. The project's `write()` uses
      `json.dumps(data, ensure_ascii=False, separators=(",", ":"))` with `encoding="utf-8"` (compact, no
      `sort_keys`), so key order comes from the code's dict literals and is still stable run to run.
- [ ] No timestamps inside data files. The project keeps build time only in corpus-stats.json (`built`,
      `seconds`, also `python`), so that one file differs between runs; the other outputs should not.
- [ ] No randomness. Expected: spaCy CPU inference with a loaded model gives the same result for the same input (UNVERIFIED in docs; prove it by running twice and diffing).
- [ ] Bundle NLTK data from a pinned download into a known directory; do not depend on whatever is in
      the machine's default nltk_data paths.
- [x] Build the nltk_data zip with sorted entries and fixed timestamps so the zip is stable across builds
      (zip entries carry dates; the project's `nltk_zip()` sets `date_time=(2026, 1, 1, 0, 0, 0)` in
      `zipfile.ZipInfo`).

## Python docs facts behind the two checklists (Python 3 docs, re-read 2026-11-28)
- `ZipInfo(filename='NoName', date_time=(1980, 1, 1, 0, 0, 0))`; the year must be >= 1980, and the time
  is read as local time, not UTC. A fixed tuple is therefore the same on every machine.
- `ZipFile.writestr(name, data)` with a plain name stamps the current time; with a `ZipInfo` it uses
  that object's date. Always pass a `ZipInfo`.
- `ZipInfo.compress_type` defaults to `ZIP_STORED`; set `ZIP_DEFLATED` on each entry if you want it.
- Python 3.14+ `writestr()` honours `SOURCE_DATE_EPOCH`; Netlify runs 3.13 here, so keep the fixed tuple.
- The docs give no order guarantee for entries written to a new archive beyond the order you add them,
  so add them from a sorted list.
- `json.dumps` defaults: `separators` is `(', ', ': ')` when `indent` is None; `(',', ':')` is the
  documented most compact form; `sort_keys=False`; dict order is preserved.
- `allow_nan=True` by default writes `NaN` / `Infinity`, which are not valid JSON and break `JSON.parse`
  in the browser; pass `allow_nan=False` so a bad float fails the build instead (the project's `write()`
  in nlp/build_nlp.py does not set it as of 2026-11-28; propose it, then run the tests).
- `ensure_ascii=False` writes characters as-is; pair it with `encoding="utf-8"` when writing the file.

## Fail-loudly checklist
- [x] `nltk.download(..., raise_on_error=True)`; its default only prints an error (`nltk_setup()`).
- [x] Make a missing model fail the build. The project uses `spacy.load("en_core_web_sm")`, which raises
      an error (not a silent fallback) when the package is absent; `import en_core_web_sm` would also do.
- [x] Assert outputs are not empty: the project's `check()` fails the build when an expert has no topics,
      there are fewer than 50 entities, no TECH entity, under 200 index phrases, fewer than 30 top words or
      5 collocations, or no positive VADER profile.
- [ ] Validate JSON shape before writing (required keys present, types correct).
- [x] Any uncaught exception already ends Python with exit code 1; `fail()` adds a clear
      "build_nlp: FAILED" message and `sys.exit(1)` for known failures.
- [x] In netlify.toml join steps with `&&`
      (`node scripts/build-team.mjs && python3 nlp/build_nlp.py && npm run build`).
- [ ] Never `|| true` or `try: ... except: pass` around NLP steps.

## Installing spaCy models at build time
| Option | Verdict |
|---|---|
| Model wheel URL in requirements.txt | chosen: installed by Netlify's automatic pip step, pinned, cached |
| `python -m spacy download en_core_web_sm` in the build command | works, but picks a version at build time and adds a step |
| Committing the model to the repo | avoid: 12 MB binary churn |
- `spacy info --url` prints the matching URL for the installed spaCy, useful when bumping versions.
- After load, log `nlp.meta["version"]` and `nlp.pipe_names` (the project writes `model`, `spacy` and
  `pipeline` into spacy.json).

## Sharing code with the browser
- The NLTK logic lives in one module imported by the build script and run by Pyodide; the build must
  copy that exact file into the public `nlp/` folder so the worker fetches the same source.
- The project does this with `shutil.copyfile(nlp/nltk_core.py, web/public/nlp/nltk_core.py)`.
- Add a check that the served copy is byte-identical to the source module (hash compare in a test). Not
  present yet: tests/python/test_build_output.py only checks that nltk_core.py exists and is non-empty.

## Local reproduction (what the README tells students and graders)
1. Create a venv with Python 3.13.
2. `pip install -r requirements.txt`.
3. Run the build script; confirm the JSON files appear in the public nlp folder.
4. Run the Python tests (pytest).
5. Run it twice and `diff` outputs: no differences expected.

## Pitfalls
- Platform differences: local macOS vs Netlify Linux can differ in default encodings; always set
  `encoding="utf-8"` explicitly.
- Old pip cache on Netlify after a version bump: use "Retry without cache" once.
- Writing into `web/dist` directly: Vite may clear it; write into the public folder instead.
- Forgetting to add the Python paths to the ignore-build path list (see the Netlify Python build note).

## Sources
- https://docs.netlify.com/build/configure-builds/manage-dependencies (accessed 2026-11-26)
- https://docs.netlify.com/build/configure-builds/file-based-configuration/ (accessed 2026-11-26)
- https://spacy.io/usage/models (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.downloader.html (accessed 2026-11-26)
- https://docs.python.org/3/library/zipfile.html (accessed 2026-11-28)
- https://docs.python.org/3/library/json.html (accessed 2026-11-28)
