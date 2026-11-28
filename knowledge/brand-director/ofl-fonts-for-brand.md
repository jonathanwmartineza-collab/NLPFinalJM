# Using SIL Open Font License fonts in a brand and on the web

- Source: OFL-FAQ (version 1.1-update8) — https://openfontlicense.org/ofl-faq/ (accessed 2026-11-28)
- Publisher: SIL Global
- Licence: proprietary (publisher's terms; the site states no reuse licence for its text; the fonts themselves are OFL-1.1) · Copy in repo: link only

Why this matters for brand-director: the site uses system fonts today, but any brand type pairing
you propose for a landing page or logo will most likely be an OFL font. You need to know what the
licence lets the owner do with a wordmark, a web font file and a subset.

## Key facts: licence basics
- The OFL is at version 1.1; later revisions apply only to future releases and there is no automatic
  "or later" upgrade. This FAQ is 1.1-update8, dated November 2026.
- OFL fonts may be used in books, posters, artwork, logos and websites; no acknowledgement is
  required for artwork.
- A font cannot be sold on its own; it can be sold as part of software or a larger bundle.
- Software that includes OFL fonts can be sold and need not be open; only the font parts stay under the OFL.
- Documents made with OFL fonts, including embedded ones, do not change licence.

## Key facts: logos and brand assets
- An OFL font can be used to make a logo or other graphic.
- The artwork stays the creator's own and does not become subject to the OFL.
- Making an image or logo with a font is not redistributing the font.

## Key facts: web fonts
- Commercial websites may serve OFL fonts with CSS web fonts; the FAQ calls this a much better
  method than asking visitors to install them.
- Serving a web font counts as distribution, which the licence allows; web fonts are not "embedding".
- WOFF or WOFF2 conversion may keep the original name only if the font data is unchanged apart from
  compression and any WOFF metadata is omitted or matches the original.
- Conversion tools and services do not automatically meet those conditions; check their output.
  Other formats such as EOT are treated as modification.
- Subsetting is modification: allowed, but it normally rules out using a Reserved Font Name.
- A modified web font can keep a Reserved Font Name only if "Functionally Equivalent": same
  character coverage, same smart-font behaviour, no visible quality loss, metadata kept; otherwise
  rename it or get written permission from the font's authors.
- Web font services must make authorship and licence information sufficiently visible to users.

## Key facts: Reserved Font Names
- A font's authors can declare one or more Reserved Font Names (RFNs) to protect the name.
- Modified or optimised versions generally must not use an RFN.

## How to apply it here
| Brand decision | What to check |
|---|---|
| Wordmark set in an OFL display face | Allowed; the logo is ours; record the font name and version |
| Self-hosting WOFF2 on Netlify | Keep the unmodified file, or rename a subset if the font has an RFN |
| Subsetting for speed | Check the font's licence file for an RFN before subsetting |
| Logo for trademark filing | Font licence is fine; trademark clearance is a separate check |
| Bundling fonts in a one-shot HTML page | Read FAQ 1.11-1.12 (embedding) and 2.1 (web fonts) first; keep the licence text with the file |
- Keep each font's licence file next to the font in the project if fonts are ever added; never
  strip its metadata.
- Prefer the system stack (current site) when no strong identity reason exists: zero licence
  questions and zero download cost.
- This is general information, not legal advice; the owner confirms licence questions.

## Limits
- The FAQ explains the OFL but is not the licence text; the official text page defines "Font Software".
- It does not cover fonts under other licences (for example proprietary foundry licences).
- Google Fonts Knowledge (fonts.google.com/knowledge) would not load without JavaScript, so type
  pairing guidance is not covered here.
