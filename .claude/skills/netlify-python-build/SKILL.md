---
name: "netlify-python-build"
description: "Use when adding or fixing the Python step of the Netlify build (PYTHON_VERSION 3.13, requirements.txt with nltk 3.9.4, spaCy 3.8.x and the en_core_web_sm 3.8.0 wheel, python nlp/build_nlp.py before the Vite build): produces a pinned, reproducible build that writes web/public/nlp/ and fails loudly, plus a local run recipe and a deploy-log check."
---
# Netlify Python build

## Purpose
The NLP Lab's static JSON is made at build time by Python on Netlify's build image, then Vite copies
`web/public/nlp/` into `web/dist`. The site stays static: no Functions, no secrets, no runtime Python on a
server. This skill makes that step reproducible on a laptop and on Netlify, and makes it fail loudly.

## Procedure
1. **Pin Python** in `netlify.toml`, next to `NODE_VERSION`:
   ```toml
   [build.environment]
     NODE_VERSION = "22"
     PYTHON_VERSION = "3.13"
   ```
   Confirm in the deploy log which Python ran (`python --version` as the first command is cheap insurance).
2. **Pin dependencies** in `requirements.txt` at the repo root:
   ```text
   nltk==3.9.4
   spacy==3.8.<patch>            # a 3.8.x release with cp313 wheels
   en_core_web_sm @ <release wheel URL for en_core_web_sm-3.8.0-py3-none-any.whl>
   pytest==<pinned>              # only if tests run in the build
   ```
   Check wheels exist before pushing: `pip download --only-binary=:all: --python-version 3.13 -r
   requirements.txt -d /tmp/wheels`. A source build of spaCy on Netlify means a missing wheel: fix the pin.
3. **Install.** Netlify's build image installs `requirements.txt` from the base directory automatically
   (look for the pip install lines in the deploy log). If the log shows no install, make it explicit in the
   command instead of guessing.
4. **Build command** in `netlify.toml`; each step must stop the chain on failure:
   ```toml
   [build]
     command = "python --version && python nlp/build_nlp.py && npm run build"
     publish = "web/dist"
   ```
   `build_nlp.py` reads agent files and `prompts/library.json` directly, so it does not depend on the Node
   prebuild. It downloads NLTK data into `nlp/.nltk_data`, writes `nltk.json`, `spacy.json`, `meta.json`,
   `nltk_data.zip`, and copies `nltk_core.py` to `web/public/nlp/`.
5. **Fail loudly.** `build_nlp.py` ends with a self-check: every output file exists, parses as JSON, has its
   `engine` field and no empty list the page shows; otherwise `sys.exit("build_nlp: <what> failed")` (non-zero).
   Never wrap it in `|| true`.
6. **Route and deploy triggers.**
   - Add an SPA redirect for the new page (the site has no catch-all, so unknown paths stay 404):
     `[[redirects]] from = "/nlp"  to = "/index.html"  status = 200`.
   - Add `nlp` and `requirements.txt` to `scripts/build-paths.txt`, or `should-build.sh` will skip deploys that
     only change Python files.
   - Keep `web/public/nlp/*.json`, `nltk_data.zip` and `nltk_core.py` copies out of git (generated), and
     `nlp/.nltk_data/` and `.venv/` in `.gitignore`.
7. **Local recipe** (same as the README):
   ```bash
   python3.13 -m venv .venv && . .venv/bin/activate
   pip install -r requirements.txt
   python nlp/build_nlp.py && python -m pytest tests/python -q
   npm ci && npm run build
   ```
8. **Record versions** in `web/public/nlp/meta.json`: Python, nltk, spaCy, model, build time (UTC), corpus
   size, nltk_data zip SHA-256. The page footnote reads from it.
9. **Deploy check.** After the push, read the deploy log (install → build_nlp → vite), then fetch
   `/nlp`, `/nlp/nltk.json`, `/nlp/spacy.json` and `/nlp/meta.json` on the live site and check status 200,
   content type JSON and non-empty fields. Use the `netlify-deploy-check` skill for the rest.

## Checklist
- [ ] `PYTHON_VERSION = "3.13"` in `netlify.toml`; deploy log confirms 3.13.
- [ ] Every requirement pinned; wheels verified for cp313; no build-time `spacy download`.
- [ ] Build command chains with `&&`; `build_nlp.py` exits non-zero on any missing or empty output.
- [ ] `/nlp` redirect added; `nlp` and `requirements.txt` listed in `scripts/build-paths.txt`.
- [ ] Generated files ignored by git; `.venv/` and `nlp/.nltk_data/` ignored.
- [ ] Local recipe works from a clean clone; versions recorded in `meta.json`.
- [ ] Live `/nlp/*.json` return 200 JSON with content.

## Output template
```
## Python build: <summary>
| Check | Command / place | Expected | Actual | Pass |
|---|---|---|---|---|
| Python version | deploy log | 3.13.x | … | … |
| Install | deploy log | nltk 3.9.4, spaCy 3.8.x, model 3.8.0 | … | … |
| build_nlp | python nlp/build_nlp.py | exit 0, 4 outputs | … | … |
| Live JSON | curl -s <site>/nlp/nltk.json | 200, engine NLTK | … | … |
First error (if any): … · Fix: …
```
