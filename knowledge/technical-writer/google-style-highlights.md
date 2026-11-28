# Google developer documentation style: the highlights

- Source: Google developer documentation style guide: Highlights — https://developers.google.com/style/highlights (accessed 2026-11-28)
- Publisher: Google (Google for Developers)
- Licence: CC-BY-4.0 · Copy in repo: link only

Why this matters for technical-writer: the README, guide page and resources page are read by busy, non-expert
visitors. A published house style settles small questions (heading case, lists, link text, dates) so every page in
the repo reads the same, whoever drafted it.

## Key facts
Tone and content
- Conversational and friendly, without becoming frivolous.
- Do not pre-announce features or changes in documentation.
- Use descriptive link text, not generic labels.
- Write accessibly, and for an international audience.

Language and grammar
- Address the reader as "you", not "we".
- Use active voice so it is clear who does what.
- Put conditions before the instructions they apply to ("If X, do Y").
- Use standard American spelling and punctuation; check the guide's word list for specific terms.

Formatting and organisation
- Sentence case for document titles and headings.
- Numbered lists for sequences of steps; bulleted lists for most other lists; description lists for pairs.
- Use the serial (Oxford) comma.
- Code-related text in code font; UI elements in bold.
- Use unambiguous date formats.

Images
- Give every image alt text; prefer high-resolution or vector images.

Licence: page content is CC BY 4.0 unless noted; code samples are Apache 2.0. Page last updated 2026-10-09.

## How to apply it here
| Rule | In this repo |
| --- | --- |
| Sentence case headings | "How to run the Python build", not "How To Run The Python Build" |
| Conditions first | "If the build skips, check scripts/build-paths.txt", not the reverse |
| Code font | `npm run build:nlp`, `netlify.toml`, `web/public/nlp/`, file and command names |
| Bold UI | **Free up space**, **Clear**, **Generate** |
| Descriptive links | "the NLTK sentiment how-to", never "click here" or a bare URL |
| Unambiguous dates | 2026-11-28 (ISO), which also matches the "(accessed YYYY-MM-DD)" rule |
| Numbered steps | Quick start: at most 5 numbered steps, one action each |
- Spelling: this repo's notes and site copy use UK spelling in places ("licence", "organise"). Pick one per page
  and keep it; do not mix inside a page. The guide's own default is American spelling.
- Do not write "coming soon" items in the README; describe what exists today.
- Alt text for every screenshot in the README, saying what the screenshot shows, not "screenshot".

## Limits
- This is the highlights page only; the full guide has detailed pages (word list, procedures, code samples).
- It does not cover document types or information architecture; see the Diátaxis note.
- It is written for developer documentation; site marketing copy is the content-designer's lane.
