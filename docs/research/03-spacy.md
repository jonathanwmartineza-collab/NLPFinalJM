# 03 — spaCy: what it does best, and its limits

spaCy is an industrial NLP library "designed specifically for production use". You load a **trained
pipeline** once and every text runs through the same components in order, giving tokens, tags, a
dependency parse, sentences, lemmas and named entities in one pass. It is fast (Cython) and its API is
consistent (`Doc`, `Token`, `Span`).

**Versions used:** spaCy **3.8.x** with the pipeline **`en_core_web_sm` 3.8.0** (compatible with
spaCy >=3.8.0,<3.9.0). spaCy's PyPI metadata lists Python 3.10–3.15; the team verified spaCy 3.8 and
the model install and run on CPython 3.13, which Netlify uses at build time.

## The pipeline: `en_core_web_sm` 3.8.0

| Item | Value |
|---|---|
| Size | 12 MB |
| Components | `tok2vec`, `tagger`, `parser`, `senter` (disabled by default), `attribute_ruler`, `lemmatizer`, `ner` |
| Trained on | OntoNotes 5, ClearNLP constituent-to-dependency conversion, WordNet 3.0 |
| Reported accuracy | NER F 84.33 · POS tag acc 97.29 · dependency UAS 91.77 |
| Licence | MIT |
| Install | wheel `en_core_web_sm-3.8.0-py3-none-any.whl` from the explosion/spacy-models GitHub release |

**18 NER labels:** CARDINAL, DATE, EVENT, FAC, GPE, LANGUAGE, LAW, LOC, MONEY, NORP, ORDINAL, ORG,
PERCENT, PERSON, PRODUCT, QUANTITY, TIME, WORK_OF_ART.

## Features we use

### 1. Named entity recognition (`doc.ents`)
Each entity is a `Span` with `.text` and `.label_` (e.g. `ORG`, `PRODUCT`). Run over every expert
profile, it shows which organisations, products and laws each expert mentions.

### 2. EntityRuler for custom labels (TECH, STANDARD)
The general model does not know that "WCAG 2.2", "React" or "OAuth" are technologies or standards. An
`entity_ruler` adds rule-based entities from patterns:
- A pattern is `{"label": "TECH", "pattern": "React"}` (exact phrase) or a list of token dicts
  (`[{"LOWER": "wcag"}, {"TEXT": {"REGEX": "^\\d"}}]`).
- **Placement matters:**
  - **before `ner`** — the statistical NER "respects the existing entity spans and adjusts its
    predictions around them" (often improves accuracy). **We use this.**
  - **after `ner`** — the ruler only adds spans that do not overlap the model's entities, unless
    `overwrite_ents=True` (default `False`).
- Overlapping ruler matches: the longest wins; ties go to the earliest.

### 3. Noun chunks as topics (`doc.noun_chunks`)
Flat base noun phrases ("accessible web pages", "prompt caching"), each with a `root` token, its
`root.dep_` and `root.head`. We lemmatise and count the chunk roots/phrases to get each expert's topics.

### 4. Dependency parse (`token.dep_`, `token.head`, `token.children`)
Every token has exactly one head and an arc label. We store a sample parse per expert (e.g. its mission
sentence) and render it with **displaCy** (`displacy.render(doc, style="dep")`), which returns markup we
can save as static SVG/HTML at build time. Entities can be rendered with `style="ent"`.

## Why spaCy for the "explore experts" part
- One call gives NER + parse + noun chunks: perfect for precomputing rich results for ~40 documents.
- EntityRuler lets us add domain labels with no training — easy to explain and test.
- Output is deterministic for a pinned model version, so the build is reproducible.

## Limits
- Pretrained on news/web text; misses domain terms (hence EntityRuler) and mislabels some product names.
- `sm` has no word vectors, so `similarity()` is weak; we do not rely on it.
- No text generation; not a research library.
- Heavy install (compiled dependencies: `thinc`, `blis`, `cymem`, `preshed`, `murmurhash`, `srsly`).

## Why spaCy does not run in the browser here
- **Not in Pyodide:** spaCy is *not* in the Pyodide 314.0.8 package list (checked the official list and
  the distribution's `pyodide-lock.json`: no `spacy`, `thinc` or `blis`).
- **Compiled dependencies:** spaCy needs WebAssembly builds of `thinc`, `blis` and friends. The only
  community wheels found (liu-nlp/spacy-pyodide) are for spaCy 3.7.5, CPython 3.12, platform
  `pyodide_2024_0` — they do not match Pyodide 314 (Python 3.14.2, ABI `2026_0`).
- **Download cost:** even if it worked, the browser would fetch Pyodide + spaCy stack + the 12 MB model
  before showing anything.
- **Not needed:** the spaCy view analyses a fixed corpus, so precomputing it at build time gives the same
  result with zero browser cost. spaCy is therefore **build-time only** in this project.

## Sources
- spaCy facts & figures — https://spacy.io/usage/facts-figures (accessed 2026-11-26)
- spaCy linguistic features — https://spacy.io/usage/linguistic-features (accessed 2026-11-26)
- spaCy rule-based matching (EntityRuler) — https://spacy.io/usage/rule-based-matching (accessed 2026-11-26)
- spaCy EntityRuler API — https://spacy.io/api/entityruler (accessed 2026-11-26)
- spaCy visualizers (displaCy) — https://spacy.io/usage/visualizers (accessed 2026-11-26)
- spaCy models usage — https://spacy.io/usage/models (accessed 2026-11-26)
- en_core_web_sm 3.8.0 release — https://github.com/explosion/spacy-models/releases/tag/en_core_web_sm-3.8.0 (accessed 2026-11-26)
- spacy on PyPI — https://pypi.org/project/spacy/ (accessed 2026-11-26)
- Pyodide packages list — https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
- Community spaCy wheels for Pyodide — https://github.com/liu-nlp/spacy-pyodide (accessed 2026-11-26)
- UNVERIFIED: the spacy.io/models/en page could not load model details at fetch time; model facts above
  come from the GitHub release page instead. The exact `requirements.txt` "name @ URL" line was not
  shown on spacy.io/usage/models (code block empty in the fetched copy); pip's direct-URL format applies.
