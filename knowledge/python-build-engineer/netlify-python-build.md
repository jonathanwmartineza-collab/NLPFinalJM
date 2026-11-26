# Running a Python step in the Netlify build

Why this matters for python-build-engineer: the NLP final produces its spaCy and NLTK results while
Netlify builds the site. Netlify must pick Python 3.13, install the pinned requirements, and run the NLP
script before Vite copies its output into the published folder. Netlify Functions are not used.

## Build image and languages (checked 2026-11-26)
- Current build image: Ubuntu 24.04 "Noble Numbat".
- Python default is `3.x`; any official Python version can be selected.
- Node default is 24 (this repo pins `NODE_VERSION = "22"` in netlify.toml; leave it).
- pip version follows the installed Python; Pipenv also available.

## Choosing the Python version
| Method | Where | Notes |
|---|---|---|
| `PYTHON_VERSION` env var | `[build.environment]` in netlify.toml or the UI | project decision: `PYTHON_VERSION = "3.13"` in netlify.toml |
| `runtime.txt` | base directory | contains only `x.y`, no trailing newline |
| `Pipfile` | base directory | Pipenv projects; `runtime.txt` wins over Pipfile |
- Use one method only. netlify.toml is already the project's single config file, so set it there and do
  not add a runtime.txt that could disagree.

## Installing Python dependencies
- If `requirements.txt` is in the base directory, Netlify runs `pip install` against it before the build
  command. No extra command needed.
- If both requirements.txt and Pipfile exist, Netlify installs requirements.txt and ignores the Pipfile.
- Base directory defaults to the repo root (this repo has no `base`), so requirements.txt lives at root.
- Dependencies are cached after the first build. Changing requirements re-runs the install, but cached
  packages may be reused; if a build misbehaves, use "Retry without cache" (clear cache and deploy).
- The docs do not say whether pip's cache or a virtualenv is kept; check `$NETLIFY_CACHE_DIR` handling in
  the image's `run-build-functions.sh` if it matters.

## Pinned requirements for this project
| Line | Why |
|---|---|
| `nltk==3.9.4` | same version as Pyodide 314.0.8, so live box and build agree |
| `spacy==3.8.18` | 3.8.x line; 3.8.18 has a cp313 manylinux x86-64 wheel (PyPI, checked 2026-11-26) |
| `en_core_web_sm @ <GitHub release wheel URL for 3.8.0>` | model as a normal dependency, no `spacy download` at build |
- The model wheel URL pattern: releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
  under github.com/explosion/spacy-models (full URL in Sources; returned HTTP 200 on 2026-11-26).
- spaCy docs recommend treating pipeline packages as regular dependencies in requirements.txt and CI.

## netlify.toml shape
- `[build] command`: steps joined with `&&` so a Python failure stops the deploy. The repo's command is
  `node scripts/build-team.mjs && python3 nlp/build_nlp.py && npm run build`: build-team.mjs writes
  web/public/team.json, which build_nlp.py reads (it fails loudly if that file is missing).
- `[build] publish = "web/dist"` stays; the script writes to `web/public/nlp/`, which Vite copies into
  `web/dist/nlp/`.
- `[build.environment]`: `PYTHON_VERSION = "3.13"` next to `NODE_VERSION = "22"` (present in netlify.toml;
  the 2026-11-26 build recorded Python 3.13.18 in corpus-stats.json).
- Precedence: values in netlify.toml override the same settings in the Netlify UI.
- Context blocks (`[context.production]`, `[context.deploy-preview]`) can override command or env.
- Netlify does not expand `$VAR` inside TOML values.
- The build command runs in Bash.

## Ignore-build script in this repo (important)
- netlify.toml has `ignore = "bash scripts/should-build.sh"`; it builds only if a path in
  `scripts/build-paths.txt` changed.
- As re-read on 2026-11-26, build-paths.txt lists web, scripts, .claude/agents, knowledge, prompts,
  netlify.toml, package files, tsconfig.json, and now also `nlp` and `requirements.txt`, so a push that
  changes only the Python NLP code does trigger a deploy. Keep both entries when editing the list.

## Limits
- Build time limit: 15 minutes by default; longer limits are granted by Netlify support, not
  self-service. Source is a Netlify staff answer on the support forum (the docs pages fetched did not
  state it), so treat it as UNVERIFIED in docs, verified by staff.
- Budget: pip install of spaCy + model (about 12 MB model plus spaCy wheels) and a small corpus should
  take well under 2 minutes; UNVERIFIED until the first deploy log, record the real time.
- Each production deploy uses credits on credit plans; batch pushes (see the shared Netlify note).

## Functions are not part of this design
- Netlify's Functions docs cover JavaScript, TypeScript and Go; Python is not offered for Functions in the
  pages fetched (the get-started page's language selector shows TypeScript, JavaScript, Go).
  UNVERIFIED: an earlier note said Lambda compatibility mode is deprecated with deploys refused from
  2027-07-01; the Lambda compatibility page fetched on 2026-11-26 did not state this. Irrelevant here,
  since the project uses no Functions.
- So Python only runs at build time; the browser gets static JSON plus Pyodide for the live box.

## Troubleshooting
- Works locally, fails on Netlify: compare versions first; the docs call version mismatch the leading
  cause of build failure.
- Netlify sets `CI=true`; some tools then treat warnings as errors.
- The build file system is case sensitive; match file name case exactly.
- `exit status 128` usually means Netlify lost permission to clone the repo.

## Sources
- https://docs.netlify.com/build/configure-builds/available-software-at-build-time/ (accessed 2026-11-26)
- https://docs.netlify.com/build/configure-builds/manage-dependencies (accessed 2026-11-26)
- https://docs.netlify.com/build/configure-builds/file-based-configuration/ (accessed 2026-11-26)
- https://docs.netlify.com/build/configure-builds/overview/ (accessed 2026-11-26)
- https://docs.netlify.com/build/configure-builds/troubleshooting-tips (accessed 2026-11-26)
- https://docs.netlify.com/build/functions/get-started (accessed 2026-11-26)
- https://docs.netlify.com/build/functions/lambda-compatibility/ (accessed 2026-11-26)
- https://answers.netlify.com/t/build-timeout-and-node-settings/52546 (staff answer; accessed 2026-11-26)
- https://spacy.io/usage/models (accessed 2026-11-26)
- https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl (HTTP 200, accessed 2026-11-26)
- https://pypi.org/project/spacy/ (accessed 2026-11-26)
- https://pypi.org/project/nltk/ (accessed 2026-11-26)
