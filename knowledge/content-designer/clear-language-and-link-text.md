# Clear language and link text: the GOV.UK rules with numbers

- Source: Use clear language — https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/ (accessed 2026-11-28)
- Supporting: Write effective links — https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/add-links/ (accessed 2026-11-28)
- Publisher: Government Digital Service (UK), GOV.UK content and publishing guidance
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for content-designer: the site's words (chat empty state, NLP Lab panel labels,
loading and error messages, the Resources page links) are read by a wide public. These rules give
hard limits to check copy against, instead of taste.

## Key facts: sentences and paragraphs
- Plain English is mandatory on GOV.UK.
- Split any sentence longer than 25 words; paragraphs of no more than 5 sentences.
- No page-length limit: one jargon-heavy paragraph can already be too long.
- Literacy context the guidance cites: about 1 in 6 adults in England have very poor literacy.
- People with more education and specialist knowledge also prefer plain English.

## Key facts: words
- Active voice by default ("You need an electronic travel authorisation"); passive is acceptable
  when the outcome matters more than who acts.
- Short words over formal ones: buy (purchase), help (assist), about (approximately).
- Avoid buzzwords and vague terms; say what is actually happening.
- Words ending in "-ion" and "-ment" tend to make sentences longer and harder.
- Use the words people use themselves; check search terms (the example compares "lorry" with
  "heavy goods vehicle").
- Specialist terms are allowed if explained in plain English the first time they appear.
- Positive contractions like "you'll" are fine; avoid negative ones ("can't", "don't") and forms
  like "should've" and "they've", which some people misread.
- Obligation words: "must" for a legal requirement, "need" for a legal requirement that is
  administrative or procedural (no criminal consequence), "can" for an option; avoid
  "You may be able to".

## Key facts: link text
- Describe where the link goes; never "click here" or "more".
- Front-load the important words; a one-word link should have at least 3 syllables.
- Do not reuse the same link text for different destinations; links to the same page should share
  the same or similar text.
- Say when a link leaves the site or goes to another language ("(in French)").
- Direct file links include format and size, e.g. "Application form (PDF, 19.5KB)".
- Task links start with a verb ("Send a tax return"); information links use the subject or the
  destination page's title.
- Put links in context in body text, not in titles, summaries or subheadings, and not in a
  "Further reading" pile at the bottom.
- Link to a specific page, not a homepage; make sure it is free to reach without registering.
- Avoid anchor links where possible; they can disorient people using assistive technology.

## How to apply it here
| Surface | Check |
|---|---|
| Chat empty state and NLP Lab intro | Sentences <= 25 words, paragraphs <= 5 sentences |
| Technical terms (tokenizer, collocation, lemma, VADER compound) | Explain on first use in plain words |
| Error and loading lines | Active voice; "cannot", not "can't"; say what happens next |
| Buttons and links | Verb first for tasks ("Analyze text", "Download results") |
| Resources page | Descriptive link text naming the destination; say when it leaves the site |
| Downloads (zip of NLTK data, JSON) | Include format and size in the link text |
- Keep a glossary row for each NLP term with its plain explanation so the same words appear on
  every page.
- Hand longer help pages to the technical writer; this note covers in-product text.

## Limits
- The guidance is written for UK government content; "must/need/can" rules are about legal
  obligations and only roughly map to product copy.
- The clear-language page sets no reading-age target and does not cover numbers, abbreviations or
  "you/we"; see the plain language note and the A to Z style guide for those.
- Neither page addresses opening links in new tabs.
