---
name: "spacy-pipeline"
description: "Use when writing or changing nlp/spacy_core.py, nlp/patterns.jsonl or the spaCy half of nlp/build_nlp.py (named entities, EntityRuler patterns, noun-chunk topics, dependency parses): produces build-time-only spaCy code with en_core_web_sm 3.8.0 and deterministic spaCy JSON for the NLP Lab."
---
# spaCy pipeline

## Purpose
spaCy runs only at build time on Netlify (CPython 3.13, spaCy 3.8.x, `en_core_web_sm` 3.8.0 installed as a
wheel from `requirements.txt`). `nlp/spacy_core.py` turns the corpus into `web/public/nlp/spacy.json`: named
entities (model NER plus an EntityRuler for project terms), noun-chunk topics and a few dependency parses the
page can draw. Nothing spaCy-related ships to the browser except that JSON.

## Procedure
1. **Load once, pinned.** Load the installed package, never `spacy.cli.download` during a build:
   ```python
   import spacy
   nlp = spacy.load("en_core_web_sm")          # 3.8.0, installed from requirements.txt
   assert nlp.meta["version"].startswith("3.8"), nlp.meta["version"]
   ```
   Record `spacy.__version__` and `nlp.meta["version"]` in the JSON.
2. **EntityRuler before NER.** Project terms (NLTK, spaCy, Pyodide, Netlify, WebLLM …) are rare in the model's
   training data, so add rules from `nlp/patterns.jsonl`, one JSON object per line:
   ```json
   {"label": "TECH", "pattern": "NLTK"}
   {"label": "TECH", "pattern": [{"LOWER": "spacy"}]}
   {"label": "ORG", "pattern": "Netlify"}
   ```
   ```python
   ruler = nlp.add_pipe("entity_ruler", before="ner")
   ruler.from_disk("nlp/patterns.jsonl")
   ```
   With `before="ner"` the rules win and the statistical model fills the rest. Keep labels few and upper case.
3. **Module contract.** `nlp/spacy_core.py` exposes plain functions that take a loaded `nlp` and text, and
   return JSON-ready dicts:
   ```python
   def entities(doc):
       return [{"text": e.text, "label": e.label_, "start": e.start_char, "end": e.end_char} for e in doc.ents]

   def topics(docs, n=20):
       from collections import Counter
       c = Counter(ch.root.lemma_.lower() for d in docs for ch in d.noun_chunks
                   if not ch.root.is_stop and ch.root.is_alpha)
       return sorted(([w, k] for w, k in c.items()), key=lambda x: (-x[1], x[0]))[:n]

   def parse(doc):
       return {"text": doc.text, "tokens": [{"i": t.i, "text": t.text, "pos": t.pos_, "dep": t.dep_,
               "head": t.head.i} for t in doc]}
   ```
   Use `nlp.pipe(texts, batch_size=64)` for the corpus. `noun_chunks` needs the parser, so never disable it.
4. **Dependency parses.** Store 3–5 short sentences (≤ 20 tokens each) chosen by a fixed rule (for example
   the first example prompt of five experts), so the page draws small, readable arcs. The root token is the one
   whose `head` equals its own `i`.
5. **Determinism.** Sort entity counts and topics by (count desc, text asc); keep document order elsewhere.
   en_core_web_sm is statistical: the same model version gives the same output, but a new version can change
   entities. Pin the model and re-run the NER gold set (`nlp-eval`) whenever it changes.
6. **Write `web/public/nlp/spacy.json`:**
   ```json
   {"engine": "spaCy", "spacy_version": "3.8.x", "model": "en_core_web_sm 3.8.0",
    "entities": {"by_label": {"TECH": [["NLTK", 12]]}, "examples": []},
    "topics": [["agent", 30]], "parses": [{"text": "…", "tokens": []}],
    "per_expert": {"spacy-expert": {"entities": [], "topics": []}}}
   ```
7. **Fail loudly.** Raise `SystemExit` when entities, topics or parses are empty, or when a pattern in
   `patterns.jsonl` fails to parse.

## Checklist
- [ ] spaCy and the model load from installed packages; no download at build time.
- [ ] EntityRuler added with `before="ner"` from `nlp/patterns.jsonl`; each line is valid JSON.
- [ ] Versions of spaCy and the model are recorded in `spacy.json`, with "engine": "spaCy".
- [ ] Topics use noun-chunk root lemmas, stop words and non-alphabetic roots removed, ties sorted.
- [ ] 3–5 parses, each ≤ 20 tokens, with heads as token indices.
- [ ] pytest covers entities (ruler and model), topics and parse shape; no list the page shows is empty.

## Output template
```
## spaCy pipeline change: <summary>
Module: nlp/spacy_core.py · Patterns: nlp/patterns.jsonl (<n> rules, labels …) · JSON: web/public/nlp/spacy.json
Versions: spaCy <x> · en_core_web_sm <y>
Checks: pytest tests/python -q → <counts>; NER gold set → <hits>/<total>
Example: "<sentence>" → entities [<text>/<label>, …]
```
