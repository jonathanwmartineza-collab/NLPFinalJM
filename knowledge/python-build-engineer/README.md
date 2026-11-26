# Knowledge index: python-build-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Netlify build image: Ubuntu 24.04 Noble; set `PYTHON_VERSION = "3.13"` in netlify.toml `[build.environment]` (no runtime.txt as well).
- requirements.txt in the repo root is pip-installed automatically before the build command.
- Pins: nltk==3.9.4, spaCy 3.8.x with cp313 wheels, en_core_web_sm 3.8.0 wheel URL.
- Build command: run the Python script, then `npm run build`, joined with `&&`.
- Add `nlp` and `requirements.txt` to the ignore-build path list or Python-only pushes skip the deploy.
- Default build limit 15 minutes (Netlify staff, forum); Functions are JS/TS/Go, not Python.
- Deterministic output: sorted inputs, sorted keys, rounded floats, no timestamps; fail loudly with non-zero exit.

## Notes
- [Running a Python step in the Netlify build](netlify-python-build.md): image, Python version, pip install, netlify.toml, ignore-build gap, limits, troubleshooting. Read before editing netlify.toml or requirements.
- [Deterministic, loud-failing build scripts](deterministic-build-scripts.md): determinism and fail-loud checklists, model install options, sharing code with the browser. Read before editing the build script.
- [NLP final architecture](../_shared/nlp-final-architecture.md): where each part runs, file map, owners.
- [Netlify platform for our apps](../_shared/netlify-platform.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-26.
