# VADER sentiment in NLTK

Why this matters for nltk-expert: VADER powers the sentiment panel and the live text box. It is a rule-based
lexicon model, so its output is deterministic and testable, and its quirks (negation, "but", caps, "!")
need to be explained honestly on the page.

## What VADER is
- Valence Aware Dictionary and sEntiment Reasoner: a lexicon of word valences plus hand-written rules,
  tuned for social-media style text. No training step, no model download beyond the lexicon.
- Cite it as: Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment
  Analysis of Social Media Text. Eighth International Conference on Weblogs and Social Media (ICWSM-14),
  Ann Arbor, MI. Both the NLTK API page and the VADER README ask for this citation.
- Lexicon licence: MIT (nltk_data index). Lexicon package id: `vader_lexicon`.

## NLTK API
- Import: `from nltk.sentiment.vader import SentimentIntensityAnalyzer`.
- Constructor: `SentimentIntensityAnalyzer(lexicon_file='sentiment/vader_lexicon.zip/vader_lexicon/vader_lexicon.txt')`.
  The default path is resolved through `nltk.data.path`, so the data folder must be on the path first.
- `sia.polarity_scores(text)` returns a dict with keys `neg`, `neu`, `pos`, `compound`.
- Build the analyzer once and reuse it (it parses the lexicon file in the constructor).

## Reading the four numbers
| Key | Meaning | Range |
|---|---|---|
| `compound` | Sum of word valences after rules, normalized | -1 (most negative) to +1 (most positive) |
| `pos` / `neu` / `neg` | Share of the text in each category | 0 to 1, together about 1 |

- `compound` is the single number to show and to classify on.
- `pos/neu/neg` are raw word-level proportions; per the README they do not include rule adjustments
  such as negation, so they can disagree with `compound` (for example "Not bad at all").
- Normalization: `normalize(score, alpha=15)`, roughly `score / sqrt(score^2 + alpha)`; alpha approximates
  the largest expected raw score. Long texts therefore saturate toward plus or minus 1.

## Standard thresholds (from the VADER README)
| Label | Rule |
|---|---|
| Positive | compound >= 0.05 |
| Neutral | -0.05 < compound < 0.05 |
| Negative | compound <= -0.05 |

- Use exactly these in both the build JSON and the live box so labels match.
- Show the raw compound value next to the label (two or three decimals).

## Rules that change the score (constants on `VaderConstants`)
| Rule | Effect | Constant |
|---|---|---|
| Booster words ("very", "extremely") | add intensity | `B_INCR = 0.293` |
| Dampeners ("kind of", "slightly") | reduce intensity | `B_DECR = -0.293` |
| ALL CAPS word in mixed-case text | adds emphasis | `C_INCR = 0.733` |
| Negation ("not", "isn't", "never") | flips and shrinks valence | `N_SCALAR = -0.74` |
| Exclamation marks | small boost per "!" (capped) | (rule in code) |
| "but" | text after "but" weighs more than text before | (rule in code) |

## Reference sentences with known scores (VADER README / NLTK howto)
| Sentence | compound |
|---|---|
| VADER is smart, handsome, and funny. | 0.8316 |
| VADER is smart, handsome, and funny! | 0.8439 |
| VADER is VERY SMART, handsome, and FUNNY. | 0.9227 |
| VADER is not smart, handsome, nor funny. | -0.7424 |
| The book was good. | 0.4404 |
| The book was only kind of good. | 0.3832 |
| A really bad, horrible book. | -0.8211 |
| At least it isn't a horrible book. | 0.431 |
| Not bad at all | 0.431 |
| The plot was good, but the characters are uncompelling and the dialog is not great. | -0.7042 |
| Today SUX! | -0.5461 |
| (empty string) | 0.0 |

- These come from the reference vaderSentiment package and the NLTK howto. NLTK's port matched them on
  the howto page; still treat exact decimals as a regression check with a small tolerance (0.001), and
  treat the sign as the hard requirement.

## Known limits to state on the page
- Sarcasm and irony are not understood ("Great, another Monday" reads positive).
- Domain words missing from the lexicon count as neutral.
- Built for short, informal English; long formal documents drift toward neutral or saturate.
- Sentence-level scoring (split with `sent_tokenize`, score each) is more informative than one score
  for a whole document; the NLTK howto does exactly this.

## Pattern for this project
- One function `sentiment(text) -> {"compound", "pos", "neu", "neg", "label"}` in the shared NLTK core
  module, used by the build script and by Pyodide, so both produce identical numbers.
- Return plain Python dicts and floats rounded to 4 places; convert to JSON for the browser.

## Sources
- https://www.nltk.org/api/nltk.sentiment.vader.html (accessed 2026-11-26)
- https://www.nltk.org/howto/sentiment.html (accessed 2026-11-26)
- https://github.com/cjhutto/vaderSentiment (accessed 2026-11-26)
- https://www.nltk.org/nltk_data/ (accessed 2026-11-26)
