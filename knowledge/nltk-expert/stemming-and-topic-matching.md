# Stemming vs lemmatization, and how the live topic matching uses them

- Source: nltk.stem.porter module — https://www.nltk.org/api/nltk.stem.porter.html (accessed 2026-11-28)
- Publisher: NLTK Project
- Licence: Apache-2.0 · Copy in repo: link only

Why this matters for nltk-expert: the live Prompt coach matches a visitor's question to indexed topics
with NLTK stems, while the topic labels themselves are spaCy lemmas made at build time. Knowing what the
stemmer does, and where it over-reaches, explains every surprising match.

Owner: nltk-expert (with spacy-expert). Used by: `nlp/nltk_core.py` (`_stem`, `_stems`, `match_topics`) and
`nlp/spacy_core.py` (noun-chunk topics).

## Key facts
- `PorterStemmer(mode='NLTK_EXTENSIONS')` is the constructor; `NLTK_EXTENSIONS` is the default and the
  mode the docs recommend for best stemming.
- Other modes: `ORIGINAL_ALGORITHM` (faithful to the 1980 paper; the docs call it deprecated) and a frozen
  mode limited to the algorithm's published reference changes. Keep the default.
- `stem(word, to_lowercase=True)`: the word is lowercased before stemming unless you pass `False`.
- Supporting page (NLTK stem howto, https://www.nltk.org/howto/stem.html, accessed 2026-11-28) prints:
  caresses → caress, flies → fli, denied → deni, agreed → agre, humbled → humbl, meeting → meet,
  itemization → item, sensational → sensat, traditional → tradit, colonizer → colon, plotted → plot.
- Same howto, Snowball: `SnowballStemmer("english").stem("running")` → run, "generously" → generous, while
  `SnowballStemmer("porter")` gives "gener"; `ignore_stopwords=True` leaves "having" unstemmed.
- Stems are often not real words (fli, deni, tradit), so never show a stem on the page.

## The difference
- **Stemming** cuts a word down to a crude stem with suffix rules, with no dictionary and no part of
  speech. It is fast and needs no model or data package. Earlier notes also gave "connection",
  "connected", "connecting" → "connect", "university" → "univers" and "news" → "new" (see Limits).
- **Lemmatization** maps a word to its dictionary form (lemma) using its part of speech: "better" (ADJ) →
  "good", "was" → "be", "mice" → "mouse". spaCy's `lemmatizer` component in en_core_web_sm uses the
  tagger's POS plus lookup and rule tables. Lemmas are real words, so they read well on screen.
- Rule of thumb: lemmatize what people will read (topic labels), stem what only a matcher compares
  (recall over precision).

## How to apply it here
- **spaCy lemmatization at deploy time:** topic phrases in `topic-index.json` are lemmatised noun chunks,
  so "landing pages" and "landing page" become one readable topic.
- **NLTK stemming live in the browser:** `match_topics` stems both the question and each indexed phrase
  with `PorterStemmer`, and a phrase matches when all of its stems appear in the question. That lets
  "accessible" find "accessibility"; lemmatization would not join those two, because they are different
  lemmas.
- **Guarding against over-stemming:** the stemmer can join unrelated words ("access" / "accessibility",
  "organ" / "organization"). `match_topics` also requires the two surface words to be of similar length
  (the shorter at least half the longer) before a stem match counts.
- Build the stemmer once and reuse it; it needs no nltk_data, so the same code runs in CPython and Pyodide.
- When a match surprises someone, show both stems side by side instead of defending the match.

| Situation | Use |
|---|---|
| Label shown to a visitor | spaCy lemma (build time) |
| Matching a live question to topics | NLTK stem, plus the length guard |
| Counting top words | neither: count lowercased surface words (`content_words`) |

## Evaluation
- Routing quality is measured with `python nlp/eval_routing.py`: a 30-question dev set (weights were
  tuned on it) and a 16-question held-out set written before tuning. Report both, and never tune on the
  held-out set.
- Known limit: acronyms that are also English words still match in lower case ("react", "rest").

## Limits
- UNVERIFIED: the stems for "connection", "university" and "news" above; neither NLTK page shows them.
  Run them with the project's nltk 3.9.4 before quoting them.
- UNVERIFIED: the lemma examples ("better" → "good", "mice" → "mouse"); they are not from this source.
  Check them with the real en_core_web_sm (spacy-expert's area).
- The NLTK API pages show version 3.9.2; behaviour on 3.9.4 is assumed the same (UNVERIFIED).
- The source does not discuss matching, ranking or routing; those rules are the project's own.

## Sources
- https://www.nltk.org/api/nltk.stem.porter.html (accessed 2026-11-28)
- https://www.nltk.org/howto/stem.html (accessed 2026-11-28)
