# Knowledge index: nlp-evaluator

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Follow the nlp-eval skill for the procedure; any required FAIL means FAIL, any required NOT RUN means PARTIAL.
- NER: score exact (span + label) matches; precision, recall, F1, plus per label.
- spaCy cross-check: `Example.from_dict(nlp.make_doc(text), {"entities": [(start, end, label)]})` then `nlp.evaluate(examples)` gives ents_p, ents_r, ents_f, ents_per_type.
- VADER sign is the hard test (thresholds plus/minus 0.05); published compounds are a regression check.
- Frequency/collocation sanity: no stopwords or punctuation in top words; planted pairs rank high; the app ranks pairs by likelihood ratio only (corpus `min_freq` 4); PMI, if ever added, needs a frequency filter.
- Existing evidence sources: tests/python (pytest on nltk_core and the built JSON) and tests/node/pyodide-nltk.mjs (live Pyodide path, parity with nltk.json).
- Every panel labeled exactly "NLTK" or "spaCy" (the page's `Lib` badge; the JSON has no `engine` field); live box: cold 30 s, warm 2 s, parity with the build JSON.

## Notes
- [Evaluating NER](ner-evaluation.md): gold sets, P/R/F1, spaCy Scorer and Language.evaluate, minimal gold set, pitfalls. Read for check C.
- [NLTK sanity checks and acceptance tests](nltk-sanity-and-acceptance.md): VADER reference sentences, frequency and collocation invariants, labeling rule, live box test. Read for checks B, D, E and F.
- [NLP final architecture](../_shared/nlp-final-architecture.md): where each part runs, file map, owners.
- [Testing and evidence](../_shared/testing-and-evidence.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-26.
