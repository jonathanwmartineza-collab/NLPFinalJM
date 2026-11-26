# Stemming vs lemmatization, and how the live topic matching uses them

Owner: nltk-expert (with spacy-expert). Used by: `nlp/nltk_core.py` (`_stem`, `_stems`, `match_topics`) and `nlp/spacy_core.py` (noun-chunk topics).

## The difference
- **Stemming** cuts a word down to a crude stem with suffix rules, with no dictionary and no part of speech. NLTK's Porter stemmer turns "connection", "connected" and "connecting" into "connect", but also "university" into "univers" and "news" into "new". Stems are often not real words. It is fast and needs no model.
- **Lemmatization** maps a word to its dictionary form (lemma) using its part of speech: "better" (ADJ) → "good", "was" → "be", "mice" → "mouse". spaCy's `lemmatizer` component in en_core_web_sm uses the tagger's POS plus lookup and rule tables. Lemmas are real words, so they read well on screen.
- Rule of thumb: lemmatize what people will read (topic labels), stem what only a matcher compares (recall over precision).

## How this app uses each
- **spaCy lemmatization at deploy time:** topic phrases in `topic-index.json` are lemmatised noun chunks, so "landing pages" and "landing page" become one readable topic.
- **NLTK Porter stemming live in the browser:** `match_topics` stems both the question and each indexed phrase, and a phrase matches when all of its stems appear in the question. That lets "accessible" find "accessibility". Lemmatization would not join those two, because they are different lemmas.
- **Guarding against over-stemming:** Porter can join unrelated words ("access" / "accessibility", "organ" / "organization"). `match_topics` also requires the two surface words to be of similar length (the shorter at least half the longer) before a stem match counts.

## Evaluation
- Routing quality is measured with `python nlp/eval_routing.py`: a 30-question dev set (weights were tuned on it) and a 16-question held-out set written before tuning. Report both, and never tune on the held-out set.
- Known limit: acronyms that are also English words still match in lower case ("react", "rest").
