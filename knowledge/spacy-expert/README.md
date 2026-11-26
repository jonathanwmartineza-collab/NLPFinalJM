# Knowledge index: spacy-expert

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- spaCy runs at build time only (not in Pyodide); pin spaCy 3.8.x and the en_core_web_sm 3.8.0 wheel URL in requirements.txt.
- en_core_web_sm 3.8.0: 12 MB, MIT, 18 OntoNotes NER labels, entity F 84.33 on its own eval data.
- EntityRuler: `nlp.add_pipe("entity_ruler", before="ner")`; patterns `{label, pattern, id}`; longer match wins.
- After ner, the ruler skips overlaps unless `overwrite_ents=True`.
- Noun chunks and sentences need the parser; never exclude it.
- Emit JSON and draw in React; do not inject displaCy HTML (XSS risk per spaCy docs).
- Batch with `nlp.pipe(texts)`; keep `n_process=1` on Netlify.

## Notes
- [Pipelines, en_core_web_sm and installing models](pipeline-and-model.md): versions, components, labels, accuracy, wheel install, add_pipe, nlp.pipe. Read before changing requirements or the pipeline.
- [NER and the EntityRuler](ner-and-entityruler.md): doc.ents, ruler config, placement, patterns, JSON shape. Read for the entities panel and patterns file.
- [Dependency parse, noun chunks and displaCy](parse-noun-chunks-displacy.md): token.dep_/head/children, noun_chunks, displaCy options and the safe-rendering rule. Read for topics and parse panels.
- [NLP final architecture](../_shared/nlp-final-architecture.md): where each part runs, file map, owners.

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-26.
