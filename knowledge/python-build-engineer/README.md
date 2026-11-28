# Knowledge index: python-build-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Netlify build image: Ubuntu 24.04 Noble; set `PYTHON_VERSION = "3.13"` in netlify.toml `[build.environment]` (no runtime.txt as well).
- requirements.txt in the repo root is pip-installed automatically before the build command.
- Pins: nltk==3.9.4, spacy==3.8.18 (has cp313 wheels), en_core_web_sm 3.8.0 wheel URL.
- Build command (netlify.toml): `node scripts/build-team.mjs && python3 nlp/build_nlp.py && npm run build` (team.json must exist before the Python step reads it).
- `nlp` and `requirements.txt` are in scripts/build-paths.txt (checked 2026-11-26), so Python-only pushes do trigger a deploy.
- Default build limit 15 minutes (Netlify staff, forum); Functions are JS/TS/Go, not Python.
- Deterministic output: sorted inputs and lists, rounded floats, fixed zip dates; the only timestamp is `built`/`seconds` in corpus-stats.json. Fail loudly with non-zero exit (`fail()` and `check()` in nlp/build_nlp.py).

## Notes
- [Running a Python step in the Netlify build](netlify-python-build.md): image, Python version, pip install, netlify.toml, ignore-build gap, limits, troubleshooting. Read before editing netlify.toml or requirements.
- [Deterministic, loud-failing NLP build scripts](deterministic-build-scripts.md): determinism and fail-loud checklists, zipfile and json facts, model install options, sharing code with the browser. Read before editing the build script.
- [NLP final architecture](../_shared/nlp-final-architecture.md): where each part runs, file map, owners.
- [Netlify platform for our apps](../_shared/netlify-platform.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-28.
