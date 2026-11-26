# NLP final: architecture, file map and who owns what
Why this matters: every agent on the NLP final works on one small pipeline. This note is the single picture
of where Python runs, what files exist, and who decides each part, so nobody rebuilds a piece someone else
owns. Decided architecture as of 2026-11-26; change it only through the orchestrator.

## The decision in one table
| Part | Runs where | Tech | Output |
|---|---|---|---|
| NLTK corpus analysis | Netlify build, CPython 3.13 | nltk 3.9.4 | static `nltk.json` |
| spaCy analysis | Netlify build only | spaCy 3.8.x + en_core_web_sm 3.8.0 | static `spacy.json` |
| Versions record | Netlify build | build script | `meta.json` |
| Live NLTK box | visitor's browser, Web Worker | Pyodide v314.0.8 (jsDelivr) + nltk 3.9.4 | results in the page |
| Page | browser | React/Vite `/nlp` page | panels labeled NLTK or spaCy |
- Netlify Functions are not used; no server Python, no secrets, no API keys.
- spaCy is not available in Pyodide (not in its package list), so spaCy is build-time only.
- nltk 3.9.4 is both the build pin and Pyodide's bundled version, so the same core module gives the same
  numbers in both places.

## NLTK features (both build and live box, from one shared core module)
- Tokenizing: `word_tokenize`, `sent_tokenize` with the `punkt_tab` data package.
- English stopwords corpus; `FreqDist` top words after lowercasing and alphabetic filtering.
- Bigram collocations: `BigramCollocationFinder`, PMI and likelihood ratio, with `apply_freq_filter`.
- VADER `SentimentIntensityAnalyzer`; labels from compound with thresholds plus/minus 0.05.

## spaCy features (build only)
- NER over the 18 OntoNotes labels, plus an EntityRuler added `before="ner"` for project terms.
- Noun chunks (topics) and dependency parses (token, relation, head index) for a few sentences.
- Output is JSON drawn by React, not displaCy HTML (XSS-safe, accessible alternatives possible).

## Build flow on Netlify
1. Netlify reads netlify.toml: `PYTHON_VERSION = "3.13"` and `NODE_VERSION = "22"` in `[build.environment]`.
2. Netlify auto-runs `pip install -r requirements.txt` from the repo root (base directory).
3. Build command runs the Python NLP script first, then the Vite build, joined with `&&`.
4. The script downloads NLTK data with errors raised, writes JSON and a trimmed nltk_data zip into the
   public nlp folder, and copies the shared NLTK core so the browser fetches the exact same file.
5. Vite copies the public folder into the published `web/dist`.
- Any Python failure exits non-zero and stops the deploy; the previous deploy stays live.
- The ignore-build path list must include the Python paths (`nlp`, `requirements.txt`), or Python-only
  pushes will skip the deploy (as read on 2026-11-26 they were missing).

## Live box flow in the browser
1. Nothing heavy loads until the visitor clicks; then a module worker starts (`type: "module"` required
   by Pyodide 314.x).
2. Worker imports `loadPyodide` from the pinned jsDelivr URL and loads the `nltk` package (pulls `regex`).
3. Worker fetches the nltk_data zip from the site, unpacks it with `unpackArchive` into the in-memory FS,
   and puts that folder first on `nltk.data.path`.
4. Worker runs the shared NLTK core; results return to the page as JSON strings.
- CSP must allow the CDN in `script-src` and `connect-src`; `'wasm-unsafe-eval'` is already present.

## File map (from the project guide, 2026-11-26)
| Path | What | Owner |
|---|---|---|
| requirements.txt | nltk, spaCy, model wheel pins | python-build-engineer |
| netlify.toml | Python version, build command, headers | devops-engineer (with python-build-engineer) |
| nlp/build_nlp.py | build entry point | python-build-engineer |
| nlp/nltk_core.py | shared NLTK logic (build + Pyodide) | nltk-expert |
| nlp/spacy_core.py, nlp/patterns.jsonl | spaCy pipeline and ruler patterns | spacy-expert |
| web/public/nlp/nltk.json, spacy.json, meta.json | generated data | build output (do not hand-edit) |
| web/public/nlp/nltk-worker.js | Pyodide worker | pyodide-engineer |
| web/src/pages/NlpPage.tsx | the /nlp page | frontend-engineer |
| tests/python, tests/unit | pytest and Vitest | qa-engineer (with experts) |
| README, Resources page | how to run, links required by the exam | technical-writer |
| agent knowledge folders | sourced notes | knowledge-curator |

## Who owns what (NLP final team)
| Agent | Person | Owns |
|---|---|---|
| orchestrator | Soraya | routes work, resolves conflicts, final synthesis |
| meta-agent | Zuri | builds and validates the NLP agents and skills |
| nltk-expert | Nora | NLTK core module, nltk.json shape, data packages |
| spacy-expert | Santiago | spaCy pipeline, EntityRuler patterns, spacy.json shape |
| pyodide-engineer | Petra | worker, Pyodide loading, data zip in the browser, live-box parity |
| python-build-engineer | Bruno | requirements, Python step in the Netlify build, determinism |
| nlp-evaluator | Esther | acceptance checks (nlp-eval skill) and the verdict |
| frontend-engineer | Pavel | the /nlp page, panels, loading/empty/error states |
| qa-engineer | Ulla | tests, gates, evidence in reports |
| devops-engineer | Xavi | Netlify import and deploy, netlify.toml, CSP headers |
| technical-writer | Wren | README, docs, Resources page |
| knowledge-curator | Hugo | these knowledge notes and their freshness |
| accessibility-specialist | Desta | WCAG 2.2 AA for the page and live box |

## Non-negotiables
- Every panel visibly labeled "NLTK" or "spaCy"; JSON carries `engine` too.
- Pinned versions everywhere; record them in meta.json and on the page.
- Anything not run is NOT RUN, never PASS.

## Sources
- https://docs.netlify.com/build/configure-builds/manage-dependencies (accessed 2026-11-26)
- https://docs.netlify.com/configure-builds/available-software-at-build-time/ (accessed 2026-11-26)
- https://docs.netlify.com/configure-builds/file-based-configuration/ (accessed 2026-11-26)
- https://spacy.io/usage/models (accessed 2026-11-26)
- https://spacy.io/usage/rule-based-matching (accessed 2026-11-26)
- https://github.com/explosion/spacy-models/releases/tag/en_core_web_sm-3.8.0 (accessed 2026-11-26)
- https://www.nltk.org/data.html (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.sentiment.vader.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/webworker.html (accessed 2026-11-26)
