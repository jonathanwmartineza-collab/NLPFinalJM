# Plain language: sentence, paragraph and style rules from Digital.gov

- Source: Clear and short (Writing for understanding) — https://digital.gov/guides/plain-language/writing/clear-short (accessed 2026-11-28)
- Supporting: Style (Writing for understanding) — https://digital.gov/guides/plain-language/writing/style (accessed 2026-11-28)
- Publisher: Digital.gov, U.S. General Services Administration
- Licence: public domain (US federal government work, per Digital.gov policies page; no SPDX id) · Copy in repo: link only

Why this matters for content-designer: the NLP Lab explains technical ideas (tokens, bigrams,
sentiment scores, entities) to visitors who are not linguists. These rules turn dense explanations
into short, positive, scannable text.

## Key facts: clear and short
- One idea per sentence; break complex information into smaller units, each the subject of its own sentence.
- Avoid stacking dependent clauses and exceptions in one sentence.
- Paragraphs: aim for no more than 150 words in 3 to 8 sentences; never more than 250 words.
- Vary paragraph length; an occasional one-sentence paragraph is fine.
- One topic per paragraph, opened with a topic sentence.
- Short sections with headings that each give a clear picture of the section, so people can skim and scan.
- If-then logic reads better as two sentences ("Suppose ... In this case ...").

## Key facts: style
- Break noun strings with prepositions: "Developing procedures to protect the safety of workers in
  underground mines", not a five-noun pile.
- Shrink wordy phrases: "in order to" > "to"; "is able to" > "can"; "a number of" > "several" or
  "many"; "on a monthly basis" > "monthly"; "at this point in time" > "now".
- Abbreviations: define on first use; no more than three per document, preferably two; skip ones
  that make reading harder; well-known ones need no definition.
- A short nickname ("the Act", "the committee") can replace a long name.
- Avoid double negatives: "no fewer than" > "at least"; "is not ... unless" > "only if".
- An exception to an exception acts as a double negative; restate it positively.
- No slashes except in fractions: decide "and" or "or"; for both, write "X, or Y, or both".
- Prefer positive wording over "not", "no", "never", "fail".
- Use pointing words (this, these), echo links and connectives (also, however, therefore) to tie
  paragraphs, without overusing them.
- Use examples for complex ideas; write "for example" or "such as", not "e.g." or "i.e.".

## How to apply it here
- NLP Lab panel help: one idea per sentence, e.g. "VADER scores each sentence. A score above 0.05
  counts as positive." (two sentences, not one with a clause).
- Glossary entries: one short paragraph each, topic sentence first, no more than 150 words.
- Limit abbreviations per screen: NLP, NLTK and spaCy are names the page already uses; spell out
  NER ("named entities") and POS ("part of speech") instead of adding more.
- Replace "and/or" in settings and privacy summaries with a decided "and" or "or".
- Rewrite negative instructions: "Text stays on your device" instead of "We do not send your text anywhere".
- Replace "e.g." and "i.e." across the UI copy with "for example" and "that is".
- Check headings: each one tells the visitor what the section answers.

## Limits
- The pages give no reading-grade target or sentence word count; the GOV.UK note's 25-word limit
  covers that.
- Written for US federal documents and web pages; legal phrasing advice ("must" vs "shall") is not
  on these two pages.
- Testing copy with people is in the Digital.gov test guide, read for the ux-researcher folder.
