# spaCy pipelines, en_core_web_sm and installing models

- Source: Models & Languages · spaCy usage documentation — https://spacy.io/usage/models (accessed 2026-11-26)
- Publisher: Explosion
- Licence: MIT · Copy in repo: link only

Why this matters for spacy-expert: spaCy runs only at build time on Netlify (it is not in Pyodide), so the
model must install reliably from a pinned wheel and the pipeline must be configured once, in the build
script, before any text is processed.

## Versions in play (checked 2026-11-26)
- spaCy on PyPI: latest 3.8.18 (2026-10-26). Requires-Python `>=3.10, <3.16`; ships cp310 to cp315
  wheels, including `cp313-cp313-manylinux_2_24_x86_64.manylinux_2_28_x86_64`, so Python 3.13 on Netlify
  installs a binary wheel, no compiler needed.
- The PyPI install text still says "Python <3.13"; that line is outdated versus the package metadata.
- The project pins `spacy==3.8.18` (requirements.txt), inside the model's `>=3.8.0,<3.9.0` range; the
  build recorded spaCy 3.8.18 and Python 3.13.18 in corpus-stats.json on 2026-11-26.
- UNVERIFIED: which early 3.8.x patch releases lack cp313 wheels (only 3.8.18 was checked).

## en_core_web_sm 3.8.0 (from its GitHub release page)
| Field | Value |
|---|---|
| spaCy requirement | `>=3.8.0,<3.9.0` |
| Size | 12 MB |
| Components | tok2vec, tagger, parser, senter, attribute_ruler, lemmatizer, ner |
| Default (enabled) pipeline | tok2vec, tagger, parser, attribute_ruler, lemmatizer, ner (senter disabled) |
| Word vectors | none (md and lg have them) |
| Training sources | OntoNotes 5, ClearNLP dependency conversion, WordNet 3.0 |
| Licence | MIT |
| Wheel asset | `en_core_web_sm-3.8.0-py3-none-any.whl` |

## NER label scheme (18 OntoNotes labels)
| Label | Meaning (short) |
|---|---|
| PERSON | people, including fictional |
| NORP | nationalities, religious or political groups |
| FAC | buildings, airports, highways, bridges |
| ORG | companies, agencies, institutions |
| GPE | countries, cities, states |
| LOC | non-GPE locations, mountains, water bodies |
| PRODUCT | objects, vehicles, foods (not services) |
| EVENT | named events (wars, storms, sports events) |
| WORK_OF_ART | titles of books, songs, etc. |
| LAW | named documents made into laws |
| LANGUAGE | any named language |
| DATE / TIME | absolute or relative dates / times under a day |
| PERCENT / MONEY / QUANTITY | percentages / money / measurements |
| ORDINAL / CARDINAL | "first", "second" / other numerals |
- Labels from the release page; meanings are the usual OntoNotes glosses (print with `spacy.explain`).

## Reported accuracy of en_core_web_sm 3.8.0 (release page)
| Metric | Score |
|---|---|
| Token accuracy | 99.86 |
| Tag accuracy | 97.29 |
| Dependency UAS / LAS | 91.77 / 89.92 |
| Sentence P / R / F | 92.01 / 89.39 / 90.68 |
| Entity P / R / F | 84.30 / 84.36 / 84.33 |
- So roughly 1 in 6 entities is wrong or missed on OntoNotes-style text; expect worse on other domains.
  Say so on the page and use the EntityRuler for project-specific names.

## Installing the model
- `python -m spacy download en_core_web_sm` picks the version matching your spaCy and runs pip. It needs
  network at run time and is less explicit than a pinned URL.
- Preferred for builds: list the model as a normal dependency. spaCy docs say pipeline packages can be
  listed in requirements.txt by direct URL and that wheels are the efficient format.
- requirements.txt line (PEP 508 direct reference; URL checked to return HTTP 200 on 2026-11-26):
  `en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl`
- `spacy info --url` prints the correct download URL for the installed spaCy (needs network).
- Load with `spacy.load("en_core_web_sm")`, or `import en_core_web_sm; nlp = en_core_web_sm.load()`.
  The import form fails fast with `ImportError` if the package is missing, which is what a build wants.
- Check at load: `nlp.meta["version"]` should be "3.8.0"; log it into the output JSON. The project loads
  with `spacy.load(MODEL)` and records `f"{MODEL} {spacy.util.get_package_version(MODEL)}"` as spacy.json's
  `model` ("en_core_web_sm 3.8.0"); tests/python/test_build_output.py asserts it starts with
  "en_core_web_sm 3.8".
- Shortcut links like `en` are deprecated as of v3.0 (docs: brittle symlinks); use the full package name.

## Pipeline mechanics
- The tokenizer runs first and is not listed in `nlp.pipe_names`.
- `nlp.pipe_names` lists active components in order; `nlp.pipeline` gives (name, component) pairs.
- `nlp.add_pipe(factory, name=None, before=..., after=..., first=..., last=True, config={...})`;
  only one of before/after/first/last may be set.
- `spacy.load(name, exclude=[...])` does not load components; `disable=[...]` loads but skips them.
- `with nlp.select_pipes(disable=["lemmatizer"]):` disables temporarily; `enable=[...]` keeps only those.
- Order matters: components that read another's output must come after it (EntityRuler goes before ner
  on purpose; see the NER note).

## Batch processing with nlp.pipe
- `nlp.pipe(texts, batch_size=..., n_process=1, as_tuples=False, disable=[...])` yields Docs lazily, in order.
- `as_tuples=True`: pass `(text, context)` and get `(doc, context)`; handy to carry a document id.
- Keep `n_process=1` on Netlify: multiprocess start-up cost outweighs gains for a few documents.
- Process the whole corpus in one `nlp.pipe` call rather than calling `nlp(text)` in a loop. The project
  does: `nlp.pipe(expert_texts, batch_size=8)` for the 36 expert documents, then one `nlp.pipe` over the
  12 prompts (only the GOAL-line sentence and the demo sentence use `nlp(text)` directly).

## Build-script checklist
- [x] Pin spaCy 3.8.x and the model wheel URL in requirements.txt (`spacy==3.8.18`).
- [ ] Load once; record `nlp.pipe_names` and model version (the project writes them into spacy.json's
      `pipeline` / `model` / `spacy` fields and corpus-stats.json rather than the build log).
- [ ] Add the EntityRuler before ner, then process with `nlp.pipe`.
- [ ] Write plain JSON (strings, ints, lists); never pickle Docs for the browser.
- [ ] Exit non-zero if the model fails to load or output is empty.

## Sources
- https://spacy.io/models/en (accessed 2026-11-26; details did not load on the page, see release page)
- https://github.com/explosion/spacy-models/releases/tag/en_core_web_sm-3.8.0 (accessed 2026-11-26)
- https://spacy.io/usage/models (accessed 2026-11-26)
- https://spacy.io/usage/processing-pipelines (accessed 2026-11-26)
- https://spacy.io/api/language (accessed 2026-11-26)
- https://pypi.org/project/spacy/ (accessed 2026-11-26)
