# NLP final — research (guide step 3)

Research for adding an **NLP Lab** (`/nlp`) to the BrainyApp2 exam copy (repo `NLPFinalJM`), so that one
app live on Netlify uses **both NLTK and spaCy**, each for a clearly labelled part. Written 2026-11-26.

## Chosen design (summary)
The site stays fully static. During the Netlify build (Ubuntu 24.04 image, Python 3.13 via
`PYTHON_VERSION`, packages from `requirements.txt`), `nlp/build_nlp.py` runs **spaCy 3.8 with
`en_core_web_sm` 3.8.0** (named entities, an EntityRuler placed before `ner` for custom TECH/STANDARD
labels, noun-chunk topics, dependency parses) and **NLTK 3.9.4** (tokenization, stopword removal,
`FreqDist`, bigram collocations by likelihood ratio, VADER sentiment) over the app's own corpus —
the 36 expert profiles (31 at time of writing + 5 NLP experts) and the 12-prompt library, MIT-licensed —
and writes static JSON to `web/public/nlp/`. In the browser, a **module Web Worker loads Pyodide 314.0.8
from jsDelivr**, which ships nltk 3.9.4, unpacks a small prebuilt NLTK data zip into Pyodide's virtual file
system, and runs the *same* `nltk_core.py` live on the user's own chat. spaCy stays build-time only
(not in Pyodide; Netlify Functions don't run Python).

## As built (where the code differs from this research)
This folder is the research written before the build. What shipped differs in these points; the code is the
reference (`nlp/build_nlp.py`, `nlp/spacy_core.py`, `nlp/nltk_core.py`):
- Collocations are ranked by Dunning's log-likelihood ratio only (no PMI column).
- The EntityRuler has TECH, STANDARD and METHOD patterns (`nlp/patterns.jsonl`) plus the team roster (names as
  PERSON, job titles as a hidden ROLE label), and statistical entities that are clearly not names are filtered.
- Each expert document is the agent's profile and prompt plus its own `knowledge/<slug>/` folder (an index for
  most experts; the five NLP experts also have their own notes). Build output: 36 + 12 = 48 documents,
  about 50,500 words (`web/public/nlp/corpus-stats.json`).
- Parses are of each library prompt's GOAL line plus one demo sentence, drawn in React from JSON (no displaCy).
- The NLP Lab is one page with six labelled panels (`web/src/pages/NlpPage.tsx`), not two tabs; spaCy results
  are in `spacy.json` and `topic-index.json` (no `experts.json`).

## Files

| File | One line |
|---|---|
| [01-use-case](01-use-case.md) | What NLP adds to BrainyApp2, users, benefits, success criteria checklist |
| [02-nltk](02-nltk.md) | NLTK features we use (punkt_tab, stopwords, FreqDist, collocations, VADER ±0.05) and limits |
| [03-spacy](03-spacy.md) | spaCy `en_core_web_sm` 3.8.0, NER, EntityRuler before `ner`, noun chunks, parse, why not in the browser |
| [04-dataset](04-dataset.md) | The BrainyApp2 Expert & Prompt Corpus: counts, licence, pre-processing, alternatives rejected |
| [05-netlify](05-netlify.md) | What Netlify runs: build image, Python at build, `netlify.toml`, limits, Functions languages |
| [06-pyodide](06-pyodide.md) | Pyodide: CDN load, `loadPackage`, module Web Worker, virtual FS, CSP, first-load cost |
| [07-architecture](07-architecture.md) | Recommended architecture, mermaid diagram, data flow, file map, alternatives rejected |

## Pinned versions

| Component | Version | Where |
|---|---|---|
| Python | 3.13 | Netlify build (`PYTHON_VERSION`) |
| NLTK | 3.9.4 | build and browser (same version on purpose) |
| spaCy / model | 3.8.x / `en_core_web_sm` 3.8.0 | build only |
| Pyodide | 314.0.8 (Python 3.14.2) | browser worker, from jsDelivr |

## Things to act on (found during research)
- Add `nlp/` and `requirements.txt` to `scripts/build-paths.txt`, or Netlify's `ignore` step will skip
  builds that change only the Python code.
- Pyodide 314 needs a **module** worker (`new Worker(url, { type: "module" })`).
- Keep `github.com` links off the `/nlp` page (existing e2e privacy test); cite sources in docs instead.
- Netlify's build time limit is not stated in the docs fetched (forum: 15 min default) — our step is small.

## Related
- [Expert roster](../expert-roster.md) · [Agent brains](../agent-brains.md) · [Docs index](../README.md)
