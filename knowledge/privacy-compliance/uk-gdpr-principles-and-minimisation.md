# UK GDPR principles, with data minimisation in practice

- Source: A guide to the data protection principles — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/ (accessed 2026-11-28)
- Supporting page: Principle (c): Data minimisation — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/ (accessed 2026-11-28)
- Publisher: Information Commissioner's Office (UK regulator)
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for privacy-compliance: the agent's first rule is "minimise first". This is the UK regulator's
own reading of the principles in Article 5, and the yardstick for the site's claim of no accounts, no analytics
and no cookies. General information, not legal advice.

## Key facts
- Article 5(1) principles: (a) lawfulness, fairness and transparency; (b) purpose limitation;
  (c) data minimisation; (d) accuracy; (e) storage limitation; (f) integrity and confidentiality (security).
- Article 5(2) accountability: the controller must be able to demonstrate compliance with the principles.
- The principles sit at the heart of the UK GDPR; they are not hard rules but the spirit of the whole regime.
- Breaching the basic principles is in the highest fine tier: up to £17.5 million or 4% of worldwide annual
  turnover, whichever is higher.
- Status: the ICO says this guidance is under review after the Data (Use and Access) Act and may change; the
  purpose limitation page was updated on 23 March 2026.

### Data minimisation (supporting page)
- Data must be "adequate, relevant and limited to what is necessary" for the purpose.
- The law does not define the three words; the ICO reads them as: adequate = enough for the purpose;
  relevant = a rational link to it; limited = no more than needed.
- Decide against a clear purpose; the answer can differ between groups of people.
- Do not collect data on the off-chance it is useful later; a foreseeable, justified need is different.
- Holding more than necessary is likely unlawful, because most lawful bases include a necessity test.
- Too little data is also a failure when the processing cannot achieve its purpose.
- People can ask for incomplete data to be completed (rectification) or unneeded data deleted (erasure).
- Checklist: collect only what you need; make sure it is enough; review periodically and delete what is not needed.

## How to apply it here
| Item on this site | Personal data? | Minimisation check |
| --- | --- | --- |
| Chat history in localStorage (last 40 messages per chat) | Can be, if a visitor types it | Stays on the device; never sent anywhere; visitor can clear it |
| Studio pages in IndexedDB | Can be | Same: local only, with a clear control |
| Preferences (`ba2-*` keys, model tier) | No identifier | Keep them free of IDs and free text |
| Downloaded model files | No | Not personal data; disclose the size and the clear option |
| Requests to the host (Netlify) | Not described by this source | Name the host in the notice and link its own policy |
- Prompts are processed by the on-device model, so no prompt goes to a model provider; keep it that way.
- The privacy page must stay true: re-check "no accounts, no analytics and no cookies" after every feature.
- A new field, log or upload needs a written purpose and retention before it is built.
- Use the six principle names in reviews so findings map to the law directly.

## Limits
- UK guidance; EU GDPR wording is near-identical for these principles but was not read for this note (the EUR-Lex
  page would not load the article text in this research round).
- The guide does not cover cookie and device-storage rules; see the storage and access technologies note.
- Fine levels and the review status can change; re-check within 6 to 12 months.
