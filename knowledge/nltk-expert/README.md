# Knowledge index: nltk-expert

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Pin nltk 3.9.4: it is also the version inside Pyodide 314.0.8, so build and live box match.
- NLTK 3.9+ needs the `punkt_tab` data package (not the old pickled `punkt`) for word_tokenize and sent_tokenize.
- Data packages: punkt_tab, stopwords, vader_lexicon; download with `raise_on_error=True`, put the folder first on `nltk.data.path`.
- VADER: use `compound`; Positive >= 0.05, Negative <= -0.05, else Neutral; cite Hutto & Gilbert (2014).
- FreqDist after lowercasing, `isalpha()` and stopword removal; report `most_common(20)`.
- Collocations: PMI only after `apply_freq_filter(2 or 3)`; show likelihood ratio beside it.

## Notes
- [Tokenization, stopwords and data packages](tokenization-and-data.md): word/sent tokenize, punkt_tab, stopwords, nltk.download and nltk.data.path, the trimmed data zip. Read before touching data or tokenizing.
- [VADER sentiment](vader-sentiment.md): API, the four scores, thresholds, rules, reference sentences, limits. Read for the sentiment panel and live box.
- [FreqDist and collocations](freqdist-and-collocations.md): counting, filters, PMI vs likelihood ratio, JSON shape. Read for top words and word pairs.
- [NLP final architecture](../_shared/nlp-final-architecture.md): where each part runs, file map, owners.

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-26.
