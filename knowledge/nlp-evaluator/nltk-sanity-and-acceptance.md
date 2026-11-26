# NLTK sanity checks and NLP Lab acceptance tests

Why this matters for nlp-evaluator: VADER, word frequencies and collocations have no gold standard on the
project's texts, so they are checked with known-answer sentences, invariants and the exam's hard
requirements (every panel labeled; the live box works). This note gives the reasoning; the nlp-eval
skill holds the exact procedure and verdict rules.

## VADER: what to test and why
- Thresholds from the VADER authors: positive if compound >= 0.05, negative if <= -0.05, else neutral.
- Sign is the hard requirement; exact decimals are a regression check (tolerance about 0.001).

| Known sentence (VADER README / NLTK howto) | compound | Tests |
|---|---|---|
| The book was good. | 0.4404 | plain positive |
| A really bad, horrible book. | -0.8211 | plain negative |
| VADER is not smart, handsome, nor funny. | -0.7424 | negation flips |
| At least it isn't a horrible book. | 0.431 | negated negative reads positive |
| Not bad at all | 0.431 | same |
| VADER is smart, handsome, and funny. | 0.8316 | baseline |
| VADER is smart, handsome, and funny! | 0.8439 | "!" raises intensity |
| VADER is VERY SMART, handsome, and FUNNY. | 0.9227 | caps raise intensity |
| The plot was good, but the characters are uncompelling and the dialog is not great. | -0.7042 | "but" shifts weight |
| (empty string) | 0.0 | no crash, neutral |

- The skill's V1-V6 sentences are the required set; the table above adds published reference values.
- Invariants worth asserting: `pos + neu + neg` is about 1 (non-empty text); compound is in [-1, 1];
  adding "!!!" never lowers the compound of a positive sentence.

## Frequency sanity
- `fd.N()` equals the number of tokens after filtering; `fd.B()` <= `fd.N()`.
- No stopword (for example "the") and no punctuation appears in the top-words list when filtering is on.
- Counts are positive integers, sorted descending; nlp/nltk_core.py `top_words()` sorts ties by word
  (`(-count, word)`), so exact order can be asserted.
- The app's filter is not plain `isalpha()`: tokens like "requirements.txt" or "n't" can appear (see the
  nltk-expert FreqDist note); assert "no stopword, no punctuation-only token" instead.
- A planted word repeated k times in a fixture text appears with count k.

## Collocation sanity
- Every reported pair occurs at least `min_freq` times: nltk.json collocations are
  `[w1, w2, llr, count]`, ranked by likelihood ratio only, with `min_freq` 4 for the corpus (so every
  `count` should be >= 4).
- PMI is undefined-ish for one-off pairs: with no filter, the top PMI pairs are rare names (the NLTK
  howto shows this on Genesis); a filter of 2 or 3 should change the list toward repeated phrases.
- Unit-test the measure functions with the howto's published values: PMI 18.38 for
  `(20, (42, 20), 14307668)`, likelihood ratio 270.72 for `(110, (2552, 221), 31777)`.
- A fixture text with a planted repeated pair ("machine learning" x5) ranks that pair near the top under
  likelihood ratio.

## Labeling requirement (exam)
- Every results panel shows which library produced it: a visible heading or badge with exactly
  "NLTK" or "spaCy"; no panel claims both.
- The JSON has no `engine` field: the library is identified by the file (nltk.json vs spacy.json) and its
  version key (`"nltk": "3.9.4"`, `"spacy": "3.8.18"`). On the page the badge is the `Lib` component
  (web/src/nlp/ui.tsx, `lib: 'NLTK' | 'spaCy'`, `where: 'live' | 'build'`).
- Accessible labeling: the badge text is real text (not only an icon or color), inside the panel's
  heading or named region.

## Live box acceptance test
1. Fresh browser profile, network on; open `/nlp`; nothing heavy loads before the visitor's click.
2. Click to start; Pyodide and NLTK load; first result appears within the skill's time budget (30 s cold).
3. Enter a positive sentence: label Positive, compound >= 0.05. Negative sentence: Negative.
4. Second analysis of about 100 words returns within 2 s (warm).
5. Parity: the live result for a fixed sentence equals the build's JSON value for the same sentence
   (same nltk 3.9.4 on both sides). tests/node/pyodide-nltk.mjs automates this: it runs `analyze` on
   nltk.json's `sample.text` in Pyodide and deep-compares `sentiment` and `top_words`.
6. Error path: block the CDN (DevTools request blocking) and confirm a friendly error and a retry button.
- No browser or no network available: mark live rows NOT RUN with the reason; the verdict is PARTIAL,
  never PASS.

## Evidence format
- For each check: command or method, actual output (numbers), PASS/FAIL/NOT RUN, and date.
- Record versions (Python, nltk, spaCy, model, Pyodide) next to the verdict.

## Sources
- https://github.com/cjhutto/vaderSentiment (accessed 2026-11-26)
- https://www.nltk.org/howto/sentiment.html (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.sentiment.vader.html (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.probability.FreqDist.html (accessed 2026-11-26)
- https://www.nltk.org/howto/collocations.html (accessed 2026-11-26)
- https://pyodide.org/en/stable/usage/packages-in-pyodide.html (accessed 2026-11-26)
