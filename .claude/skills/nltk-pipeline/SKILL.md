---
name: "nltk-pipeline"
description: "Use when writing or changing nlp/nltk_core.py or the NLTK half of nlp/build_nlp.py (tokenizing, stopwords, FreqDist, collocations, VADER sentiment): produces one pure-Python module that runs the same in CPython at build time and in Pyodide in the browser, plus deterministic NLTK JSON for the NLP Lab."
---
# NLTK pipeline

## Purpose
One shared module, `nlp/nltk_core.py`, does all NLTK work for the NLP Lab. It runs twice with the same
code: at build time on Netlify (CPython 3.13, `nltk==3.9.4`) to write `web/public/nlp/nltk.json`, and
live in the visitor's browser through Pyodide (see the `pyodide-nltk` skill). So it must be pure Python,
deterministic and free of file or network access. spaCy never appears in this module.

## Procedure
1. **Data packages.** NLTK 3.9 tokenizes with `punkt_tab` (not the old pickled `punkt`). The module needs
   exactly three packages; fetch them into a local folder at build time, never into the home directory:
   ```bash
   python -m nltk.downloader -d nlp/.nltk_data punkt_tab stopwords vader_lexicon
   ```
   Point NLTK at it before any call: `nltk.data.path.insert(0, NLTK_DATA)`. Keep `nlp/.nltk_data/` out of git.
2. **Module contract.** Standard library + `nltk` only; no `print`, no `open`, no downloads, no globals that
   change between calls. Public functions, all returning plain JSON-ready types:
   ```python
   # nlp/nltk_core.py
   from nltk import FreqDist
   from nltk.collocations import BigramCollocationFinder, BigramAssocMeasures
   from nltk.corpus import stopwords
   from nltk.sentiment.vader import SentimentIntensityAnalyzer
   from nltk.tokenize import sent_tokenize, word_tokenize

   _STOP = None
   _VADER = None

   def tokenize(text: str) -> list[str]:
       return [t for t in word_tokenize(text) if any(c.isalnum() for c in t)]

   def content_words(tokens: list[str]) -> list[str]:
       global _STOP
       _STOP = _STOP or set(stopwords.words("english"))
       return [t.lower() for t in tokens if t.lower() not in _STOP and len(t) > 1]

   def top_words(words: list[str], n: int = 20) -> list[list]:
       fd = FreqDist(words)
       return sorted(([w, c] for w, c in fd.items()), key=lambda x: (-x[1], x[0]))[:n]

   def collocations(words: list[str], n: int = 10, min_freq: int = 2) -> list[list]:
       finder = BigramCollocationFinder.from_words(words)
       finder.apply_freq_filter(min_freq)
       scored = finder.score_ngrams(BigramAssocMeasures.likelihood_ratio)
       return [[a, b, round(s, 4)] for (a, b), s in sorted(scored, key=lambda x: (-x[1], x[0]))[:n]]

   def sentiment(text: str) -> dict:
       global _VADER
       _VADER = _VADER or SentimentIntensityAnalyzer()
       s = {k: round(v, 4) for k, v in _VADER.polarity_scores(text).items()}
       c = s["compound"]
       s["label"] = "positive" if c >= 0.05 else "negative" if c <= -0.05 else "neutral"
       return s

   def analyze(text: str, top_n: int = 20) -> dict:
       tokens = tokenize(text)
       words = content_words(tokens)
       return {"engine": "NLTK", "sentences": len(sent_tokenize(text)), "tokens": len(tokens),
               "types": len(set(words)), "top_words": top_words(words, top_n),
               "collocations": collocations(words), "sentiment": sentiment(text)}
   ```
3. **Determinism.** `FreqDist.most_common` breaks ties by insertion order, so always sort by
   (count desc, word asc). Round every float to 4 decimals. The same input must give byte-identical JSON in
   CPython and Pyodide; that is the parity test in the `nlp-eval` skill.
4. **Collocations on a small corpus.** Filter pairs seen fewer than 2 times, then score with
   `likelihood_ratio`; raw PMI ranks one-off pairs first. Report the measure name in the JSON.
5. **VADER rules.** Score the original text, not the stopword-filtered tokens: VADER uses capitals,
   punctuation, negations ("not bad") and boosters ("very"). Compound thresholds are ±0.05. Score per sentence
   for the corpus, and report the mean plus the three most positive and most negative sentences.
6. **Corpus build.** In `nlp/build_nlp.py`, build documents from the experts' display fields (mission,
   personality, example prompts) and `prompts/library.json` (title + prompt). Write `web/public/nlp/nltk.json`:
   ```json
   {"engine": "NLTK", "nltk_version": "3.9.4", "documents": 0,
    "corpus": {"tokens": 0, "types": 0, "top_words": [], "collocations": [], "measure": "likelihood_ratio"},
    "sentiment": {"mean_compound": 0.0, "most_positive": [], "most_negative": []},
    "per_expert": {"nltk-expert": {"top_words": [], "sentiment": {}}}}
   ```
7. **Fail loudly.** If any list the page shows is empty, raise `SystemExit("nltk.json: <field> is empty")`.

## Checklist
- [ ] `nltk_core.py` imports only the standard library and `nltk`; no I/O, no downloads, no spaCy.
- [ ] Data path set from a parameter; `punkt_tab`, `stopwords`, `vader_lexicon` present before the first call.
- [ ] Ties sorted, floats rounded; the same text gives identical output twice in a row.
- [ ] VADER runs on raw text; labels use the ±0.05 thresholds.
- [ ] `nltk.json` names the engine ("NLTK") and the NLTK version; no list the page shows is empty.
- [ ] pytest in `tests/python/` covers tokenize, top_words ties, collocations and the VADER sign sentences.

## Output template
```
## NLTK pipeline change: <summary>
Module: nlp/nltk_core.py (functions changed: …) · JSON: web/public/nlp/nltk.json (fields changed: …)
Data packages: punkt_tab, stopwords, vader_lexicon (path: …)
Checks: pytest tests/python -q → <passed/failed counts>; parity with Pyodide → <same / differs / NOT RUN>
Example: analyze("It is not bad at all.") → compound <x>, label <y>
```
