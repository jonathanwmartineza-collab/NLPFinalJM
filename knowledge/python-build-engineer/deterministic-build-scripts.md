# Deterministic, loud-failing NLP build scripts

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
- [ ] Round floats (VADER to 4 places, PMI/likelihood to 3) before writing.
- [ ] `json.dump(data, f, ensure_ascii=False, sort_keys=True, indent=2)` with `encoding="utf-8"` and
      `newline="\n"`.
- [ ] No timestamps inside data files; put build time only in a separate metadata field if needed, or
      reuse the repo's existing version stamp.
- [ ] No randomness. Expected: spaCy CPU inference with a loaded model gives the same result for the same input (UNVERIFIED in docs; prove it by running twice and diffing).
- [ ] Bundle NLTK data from a pinned download into a known directory; do not depend on whatever is in
      the machine's default nltk_data paths.
- [ ] Build the nltk_data zip with sorted entries and fixed timestamps so the zip is stable across builds
      (zip entries carry dates; set a constant `date_time` in `zipfile.ZipInfo`).

## Fail-loudly checklist
- [ ] `nltk.download(..., raise_on_error=True)`; its default only prints an error.
- [ ] Import the model as a package (`import en_core_web_sm`) so a missing model is an ImportError.
- [ ] Assert outputs are not empty: tokens > 0, at least one entity, at least one VADER score.
- [ ] Validate JSON shape before writing (required keys present, types correct).
- [ ] Top-level `main()` wrapped so any exception prints a clear message and `sys.exit(1)`.
- [ ] In netlify.toml join steps with `&&` (`python nlp/build_nlp.py && npm run build`).
- [ ] Never `|| true` or `try: ... except: pass` around NLP steps.

## Installing spaCy models at build time
| Option | Verdict |
|---|---|
| Model wheel URL in requirements.txt | chosen: installed by Netlify's automatic pip step, pinned, cached |
| `python -m spacy download en_core_web_sm` in the build command | works, but picks a version at build time and adds a step |
| Committing the model to the repo | avoid: 12 MB binary churn |
- `spacy info --url` prints the matching URL for the installed spaCy, useful when bumping versions.
- After load, log `nlp.meta["version"]` and `nlp.pipe_names`.

## Sharing code with the browser
- The NLTK logic lives in one module imported by the build script and run by Pyodide; the build must
  copy that exact file into the public `nlp/` folder so the worker fetches the same source.
- Add a check that the served copy is byte-identical to the source module (hash compare in a test).

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
- https://docs.netlify.com/configure-builds/file-based-configuration/ (accessed 2026-11-26)
- https://spacy.io/usage/models (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.downloader.html (accessed 2026-11-26)
- Python standard library `zipfile` and `json` docs: https://docs.python.org/3/library/zipfile.html and
  https://docs.python.org/3/library/json.html (UNVERIFIED this session: not fetched; standard behavior)
