# FreqDist and bigram collocations in NLTK

Why this matters for nltk-expert: the "top words" and "word pairs" panels come from FreqDist and
BigramCollocationFinder. Both are easy to get subtly wrong (punctuation, stopwords, tiny corpora), and
PMI in particular rewards rare pairs unless you filter.

## FreqDist (nltk.probability.FreqDist)
- A subclass of Python's `Counter` that counts outcomes (here: tokens).
- `FreqDist(tokens)` counts an iterable; `FreqDist()` starts empty.

| Method | Returns |
|---|---|
| `most_common(n)` | top n `(sample, count)` pairs, most frequent first |
| `N()` | total number of outcomes counted (tokens) |
| `B()` | number of distinct samples (types), same as `len(fd)` |
| `freq(sample)` | `count / N()`, a float 0 to 1 |
| `hapaxes()` | samples seen exactly once |
| `max()` | the most frequent sample |
| `tabulate()` / `plot()` | console table / Matplotlib plot (plot needs Matplotlib; not for the web) |

- It overrides `update()` so the cached `N()` stays correct; keep using `update()` rather than editing
  counts directly.
- Type-token ratio for a quick richness figure: `fd.B() / fd.N()`.

## Pre-processing before counting (what nlp/nltk_core.py does)
1. `tokenize()`: `word_tokenize`, then drop tokens with no letter or digit (punctuation-only tokens).
2. `content_words()`: lowercase, strip quote marks (`'`, `’`, backtick), keep a token only if it is longer
   than one character, has at least one letter (so "wcag-2" or "requirements.txt" survive; plain
   `isalpha()` is NOT used), and is not in `stopwords.words('english')` plus the module's `EXTRA_STOP` set.
3. Build only (nlp/build_nlp.py): words found in more than half of the expert documents ("house words")
   are removed before the corpus counts and collocations.
4. `top_words()`: count with `FreqDist`, sort by `(-count, word)`, keep the first n (30 for the corpus,
   8 per expert, 12 for live `analyze`, 6 per prompt).
- Say on the page which of these steps were applied, so the numbers can be reproduced.

## Collocations: building the finder
- `from nltk.collocations import BigramCollocationFinder` and `from nltk.metrics import BigramAssocMeasures`
  (also reachable as `nltk.collocations.BigramAssocMeasures`).
- `finder = BigramCollocationFinder.from_words(tokens)`; by default only adjacent pairs count.
- `from_words(tokens, window_size=N)` also counts pairs up to N-1 words apart (the howto uses 20).
- `measures = BigramAssocMeasures()`.

## Filters (apply before scoring)
| Call | Effect |
|---|---|
| `finder.apply_freq_filter(k)` | drop pairs seen fewer than k times |
| `finder.apply_word_filter(fn)` | drop pairs where `fn(word)` is true for any word |
| `finder.apply_ngram_filter(fn)` | drop pairs where `fn(w1, w2)` is true |

- Typical word filter: `lambda w: len(w) < 3 or w.lower() in STOP`.
- Filters change the candidate set permanently for that finder; build a new finder for a different setup.

## Scoring
| Call | Returns |
|---|---|
| `finder.nbest(measures.pmi, 10)` | top 10 pairs only |
| `finder.score_ngrams(measures.likelihood_ratio)` | all `(pair, score)` pairs, best first |

## Which measure to show
| Measure | Rewards | Weak spot | Use here |
|---|---|---|---|
| `pmi` | pairs that almost always co-occur | rare pairs (seen once or twice) dominate | only after `apply_freq_filter(2 or 3)` |
| `likelihood_ratio` | pairs that are both frequent and associated | less intuitive number | good default ranking |
| `chi_sq` | association | sensitive with small counts | optional |
| `raw_freq` | plain frequency | shows "of the" style pairs | baseline only |

- The howto shows PMI on Genesis: without a filter the top pairs are one-off names; after
  `apply_freq_filter(3)` it shifts to recurring expressions such as "Most High".
- The app shows likelihood ratio only (Dunning's LLR, `BigramAssocMeasures.likelihood_ratio`); if PMI is
  added later, show it beside LLR and say what each favors.

## Checked values (from the howto, useful as unit tests of the measure functions)
| Call | Result |
|---|---|
| `BigramAssocMeasures.pmi(20, (42, 20), 14307668)` | 18.38 (rounded) |
| `BigramAssocMeasures.likelihood_ratio(110, (2552, 221), 31777)` | 270.72 (rounded) |
| `BigramAssocMeasures.chi_sq(8, (15828, 4675), 14307668)` | 1.55 (rounded) |

- Arguments are contingency marginals: `(n_ii, (n_ix, n_xi), n_xx)` = pair count, counts of each word,
  total.

## Output shape in web/public/nlp/nltk.json (and the live `analyze` result)
- Top words: list of `[word, count]` pairs.
- Collocations: list of `[w1, w2, llr_score, pair_count]`, LLR rounded to 2 places, sorted by score then
  pair; adjacent bigrams only (no `window_size`).
- `min_freq`: 4 for the build corpus (`collocations(all_words, 20, 4)`); live text uses 2 when it has more
  than 60 content words, else 1. Fewer than 3 words returns `[]`.
- Record the settings used (`min_freq`, stopwords on or off) next to the results.

## Pitfalls
- Short live-box input: with `min_freq` 1 every pair scores alike (the build's sample text shows eight
  pairs all at 7.61); on a few sentences say "not enough text" rather than presenting a ranking.
- Ties: `FreqDist.most_common` orders equal counts by insertion; the app avoids this by sorting on
  `(-count, word)`, so exact order can be asserted for the app's output.

## Sources
- https://www.nltk.org/api/nltk.probability.FreqDist.html (accessed 2026-11-26)
- https://www.nltk.org/howto/collocations.html (accessed 2026-11-26)
- https://www.nltk.org/howto/corpus.html (accessed 2026-11-26)
