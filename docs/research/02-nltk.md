# 02 — NLTK: what it does best, and its limits

NLTK (Natural Language Toolkit) is a pure-Python teaching and research library. It gives you many small,
transparent building blocks (tokenizers, corpora, counters, association measures, a rule-based sentiment
model) rather than one big trained pipeline. That makes it ideal for showing *how* each step works.

**Version used:** nltk **3.9.4** (released 2026-03-24 on PyPI). The newest release is 3.10.4 (2026-10-21),
but we pin 3.9.4 on purpose because it is the exact version Pyodide 314.0.8 ships, so the build-time
Python and the in-browser Python run identical NLTK code.

## Features we use

### 1. Tokenization (`word_tokenize`, `sent_tokenize`)
- `sent_tokenize(text, language="english")` splits sentences with the **Punkt** sentence tokenizer.
- `word_tokenize(text)` combines an improved **Treebank** word tokenizer with Punkt.
- Punkt needs trained parameters. Since NLTK 3.9 these come as the **`punkt_tab`** data package
  (plain tab-separated files) instead of the old pickled `punkt` models; NLTK 3.9 removed the need for
  pickled models to fix security issue CVE-2024-39705.
- Size note (measured locally): the full `punkt_tab.zip` is 4.3 MB (all languages); the `english` folder
  alone is about 248 KB, so we ship only English.

### 2. Stopword removal (`nltk.corpus.stopwords`)
- The `stopwords` package (37.7 KB zip) holds word lists per language; the English list in the current
  download has about 198 entries. We remove them before counting so "the/and/to" do not dominate.

### 3. Frequency distribution (`FreqDist`)
- Counts tokens; `most_common(n)` gives the top words for the chart. Simple, fast, easy to explain.

### 4. Collocations (`BigramCollocationFinder` + `BigramAssocMeasures`)
- `BigramCollocationFinder.from_words(tokens)` collects word pairs.
- `apply_freq_filter(k)` drops pairs seen fewer than *k* times; `apply_word_filter(...)` drops stopwords.
- `nbest(BigramAssocMeasures.pmi, 10)` ranks by **pointwise mutual information** (how much more often
  the pair occurs than chance). PMI rewards rare pairs, so a frequency filter is essential.
- `nbest(BigramAssocMeasures.likelihood_ratio, 10)` ranks by **likelihood ratio**, which is more
  stable on small texts. We show both, side by side, to teach the difference.

### 5. Sentiment with VADER (`nltk.sentiment.vader.SentimentIntensityAnalyzer`)
- VADER (Hutto & Gilbert, ICWSM 2014) is a **lexicon- and rule-based** model built for short social-media
  style text. It needs no training and runs instantly.
- Data package: **`vader_lexicon`** (90.5 KB; about 7,500 scored entries). NLTK's default lexicon path is
  `sentiment/vader_lexicon.zip/vader_lexicon/vader_lexicon.txt`.
- Rules include negation words ("not", "never"), boosters/dampeners ("extremely", "slightly"),
  ALL-CAPS emphasis and fixed idioms.
- `polarity_scores(text)` returns `neg`, `neu`, `pos` and **`compound`**. The compound score is the
  summed, rule-adjusted valence **normalised to −1 … +1**.
- Standard thresholds from the VADER authors:

| Compound score | Label |
|---|---|
| ≥ **0.05** | positive |
| between −0.05 and 0.05 | neutral |
| ≤ **−0.05** | negative |

### 6. Data packages (`nltk.download`)
- NLTK code and NLTK *data* are separate. Data is fetched with `nltk.download("<id>")` or
  `python -m nltk.downloader -d <dir> <id>`, and found via the `NLTK_DATA` path list.
- We need exactly three ids: `punkt_tab`, `stopwords`, `vader_lexicon`.
- At build time we download them once, then pack the English subset into **one zip** served from the
  site; the browser worker unpacks it into Pyodide's file system and adds that folder to `nltk.data.path`.
- Note (verified by the team): NLTK 3.10 added download path-security checks that refuse proxied
  fetches in some sandboxes. This does not affect Netlify builds, and we pin 3.9.4 anyway.

## Why NLTK for the live part
- Pure Python (its only compiled dependency, `regex`, is prebuilt in Pyodide), so it runs in the browser.
- Small: the nltk wheel is ~1.2 MB and regex ~0.2 MB in the Pyodide 314.0.8 distribution.
- Each step is visible and explainable — good for an NLP course.

## Limits (be honest in the report)
- No modern pretrained pipeline: no built-in neural NER or dependency parser of spaCy's quality.
- VADER is tuned for short, informal English; it misreads sarcasm, domain jargon and long technical text.
- Stopword lists are generic; technical words like "use" or "data" may still dominate.
- PMI is unreliable on tiny inputs; results on a two-line chat are noisy.
- Data must be downloaded separately; forgetting a package gives a `LookupError` at run time.
- Slower than spaCy on large corpora (pure Python).

## Sources
- NLTK tokenize API — https://www.nltk.org/api/nltk.tokenize.html (accessed 2026-11-26)
- NLTK collocations how-to — https://www.nltk.org/howto/collocations.html (accessed 2026-11-26)
- NLTK sentiment how-to — https://www.nltk.org/howto/sentiment.html (accessed 2026-11-26)
- NLTK VADER API — https://www.nltk.org/api/nltk.sentiment.vader.html (accessed 2026-11-26)
- NLTK data / downloader — https://www.nltk.org/data.html (accessed 2026-11-26)
- NLTK data index (package ids and sizes) — https://www.nltk.org/nltk_data/ (accessed 2026-11-26)
- NLTK release notes (3.9: CVE-2024-39705) — https://www.nltk.org/news.html (accessed 2026-11-26)
- nltk on PyPI (versions, dates) — https://pypi.org/project/nltk/ (accessed 2026-11-26)
- VADER README (compound, thresholds, MIT licence, citation) — https://github.com/cjhutto/vaderSentiment (accessed 2026-11-26)
- Pyodide packages list (nltk 3.9.4, regex) — https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
- Local measurement: sizes of `punkt_tab.zip`, `stopwords.zip`, `vader_lexicon.zip` and the Pyodide 314.0.8 wheels, 2026-11-26.
- UNVERIFIED from docs: the punkt → punkt_tab switch is not named on the nltk.org pages fetched; it is
  confirmed by the data index listing `punkt_tab` and by NLTK 3.9.x requiring it in practice.
