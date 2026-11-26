# Evaluating NER: gold labels, precision, recall, F1 and spaCy's Scorer

Why this matters for nlp-evaluator: the final exam needs evidence that the spaCy panel is right, not that
it looks plausible. A small gold set scored with precision, recall and F1 (by hand or with spaCy's own
`nlp.evaluate`) turns "seems fine" into a number with a pass threshold.

## Core idea
- Gold set: sentences with the entities a careful human expects, as (start_char, end_char, label).
- Prediction: what the pipeline puts in `doc.ents`.
- A prediction is correct only if text span AND label both match exactly (spaCy's labeled span scoring).

| Measure | Formula | Plain meaning |
|---|---|---|
| Precision (P) | correct predicted / all predicted | how many shown entities are right |
| Recall (R) | correct predicted / all gold | how many real entities were found |
| F1 | 2PR / (P + R) | one balanced number |
- Report per label too (`ents_per_type`); a good overall F1 can hide a broken custom label.
- Unlabeled check (span boundaries only) helps tell "wrong label" from "wrong span".

## Reference point for expectations
- en_core_web_sm 3.8.0 reports entity P/R/F of 84.30 / 84.36 / 84.33 on its OntoNotes evaluation data.
- On the project's own short texts (tech names, course terms) expect lower recall for the statistical
  model; EntityRuler patterns should score 100% on the exact phrases they list.
- So gate on: all ruler entities found with the right label, and most (for example 2 of 3) statistical
  entities in the gold sentences, as the nlp-eval skill specifies.

## spaCy's evaluation API (v3)
- `Example` pairs a predicted Doc with a reference Doc: `Example(predicted, reference)`.
- Build from gold dict: `Example.from_dict(nlp.make_doc(text), {"entities": [(0, 5, "ORG"), ...]})`
  (import from `spacy.training`).
- `entities` accepts either a list of `(start_char, end_char, label)` tuples or BILUO tags per token;
  pick one format, do not mix.
- `scores = nlp.evaluate(examples)` runs the pipeline on each example's text and returns a dict.
  Arguments: `examples`, `batch_size`, `scorer`, `component_cfg`, `scorer_cfg`, `per_component` (v3.6+).
- Entity keys in the result: `ents_p`, `ents_r`, `ents_f`, `ents_per_type` (per-label P/R/F).
- UNVERIFIED (not stated on the fetched pages): whether these values are fractions 0-1 or percentages.
  Print one result and check the scale before setting thresholds.
- `Scorer(nlp)` and `scorer.score(examples)` do the same scoring directly; `Scorer.score_spans(...,
  labeled=False)` scores boundaries only.
- Other keys you get for free: `token_acc`, `dep_uas`, `dep_las`, `tag_acc` (if those components ran).

## Minimal gold set (aligned with the nlp-eval skill)
| ID | Sentence | Gold entities |
|---|---|---|
| N1 | Apple is looking at buying U.K. startup for $1 billion. | Apple ORG, U.K. GPE, $1 billion MONEY |
| N2 | We parse text with NLTK and spaCy on Netlify. | NLTK TECH, spaCy TECH, Netlify TECH (nlp/patterns.jsonl) |
| N3 | Pyodide runs Python in the browser. | Pyodide TECH, Python TECH (nlp/patterns.jsonl) |
- N1 is the docs' classic example sentence; good as a statistical sanity check.
- Take expected custom labels from the project's patterns file (labels TECH, STANDARD, METHOD; 107
  patterns); do not invent labels in the test.
- What the repo already asserts (tests/python/test_build_output.py on spacy.json): a WCAG entity labelled
  STANDARD for accessibility-specialist, `["Portland", "GPE"]` in the demo sentence, TECH total > 50,
  STANDARD total > 10, and entity_ruler placed before ner. spacy.json stores entities as
  `[text, label, count]` without offsets, so span-level P/R/F needs a fresh pipeline run, loaded exactly
  as `nlp/spacy_core.py load()` does.
- Store gold data as JSON/py fixtures next to the Python tests so the same set runs in CI and locally.

## How to compute by hand (no spaCy scorer needed)
1. Gold set G and predicted set P as sets of `(start, end, label)`.
2. `tp = len(G & P)`; `P_ = tp / len(P)`; `R_ = tp / len(G)`; F1 from the formula.
3. Guard divide-by-zero: if nothing predicted, precision is undefined; report 0 and flag it.
- Hand computation is transparent for the report; `nlp.evaluate` is the cross-check.

## Writing the result
- Table: sentence id, expected, found, hits/expected.
- Overall P/R/F1 plus per-label rows; name the spaCy and model versions.
- Any FAIL names the owner (spacy-expert for patterns/pipeline, python-build-engineer for build issues).

## Pitfalls
- Character offsets off by one (end is exclusive), or including the trailing period.
- Comparing labels case-insensitively by accident; labels are uppercase strings.
- Evaluating with a pipeline that lacks the EntityRuler (load it exactly as the build does).
- Treating a gold set of three sentences as a benchmark; it is a smoke test, say so.

## Sources
- https://spacy.io/api/scorer (accessed 2026-11-26)
- https://spacy.io/api/language (accessed 2026-11-26; Language.evaluate)
- https://spacy.io/api/example (accessed 2026-11-26)
- https://spacy.io/api/data-formats (accessed 2026-11-26; entities annotation formats)
- https://github.com/explosion/spacy-models/releases/tag/en_core_web_sm-3.8.0 (accessed 2026-11-26)
- https://spacy.io/usage/linguistic-features (accessed 2026-11-26)
