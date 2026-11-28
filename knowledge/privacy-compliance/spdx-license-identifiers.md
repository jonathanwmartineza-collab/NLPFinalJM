# SPDX licence identifiers for licence checks

- Source: SPDX License List — https://spdx.org/licenses/ (accessed 2026-11-28)
- Publisher: SPDX project (Linux Foundation)
- Licence: unconfirmed · Copy in repo: link only

Why this matters for privacy-compliance: the agent checks the licences of packages, fonts, models and content.
SPDX identifiers are the standard short names for those licences, so a licence list or attribution page that uses
them can be checked by tools and by people without guessing.

## Key facts
- Current list: version 3.29.0, dated 2026-09-16.
- Purpose: standard identifiers so licences and exceptions can be named efficiently and reliably in SPDX
  documents and in files.
- Each entry has a full name, a short identifier, the licence text and a permanent URL.
- The table also has two columns: FSF Free/Libre and OSI Approved. Read the row; do not assume.
- Exceptions attach with `WITH`, for example `GPL-2.0-or-later WITH Autoconf-exception-2.0`.
- A `+` after an identifier means "or a later version".
- Deprecated identifiers should no longer be used but stay valid; examples: `AGPL-3.0` (deprecated in 3.0),
  `AGPL-1.0`, `BSD-2-Clause-FreeBSD`. The page cites the GNU identifier change in 3.0 as one reason; use the
  current `-only` or `-or-later` forms that appear in the main table.
- Identifiers confirmed on the list in this round: MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD, Unlicense,
  MPL-2.0, LGPL-3.0-only, GPL-3.0-only, AGPL-3.0-only, Python-2.0, OFL-1.1, CC0-1.0, CC-BY-3.0, CC-BY-4.0,
  CC-BY-SA-2.5, CC-BY-SA-4.0, OGL-UK-3.0.

## How to apply it here
- This project's own licence is `MIT` (package.json and LICENSE agree).
- Licence review routine:
  1. Read `package.json` and `package-lock.json` `license` fields; Python packages from `requirements.txt`.
  2. Map each to an SPDX identifier; anything that is not on the list, missing or "SEE LICENSE" is a finding.
  3. Group: permissive (MIT, BSD, ISC, Apache-2.0), weak copyleft (MPL-2.0, LGPL), strong or network copyleft
     (GPL, AGPL). Strong copyleft goes to the owner for a decision.
  4. Content and docs: CC-BY needs attribution; CC-BY-SA also needs share-alike; OGL-UK-3.0 needs the
     attribution statement the licence asks for.
  5. Fonts: usually OFL-1.1; check the font's own file.
  6. Model weights carry their own licence terms; record the exact identifier or "custom terms" per model.
- Attribution list format for the site's credits page:
  | Component | Version | SPDX id | Notice needed? |
  | --- | --- | --- | --- |
  | (package or asset) | (pinned version) | (id from the list) | yes for Apache-2.0 NOTICE files, CC-BY credits |
- A deprecated id found in a dependency is not a blocker; record the current equivalent beside it.
- Re-check the list version when reviewing; new identifiers are added in each release.
- Write identifiers exactly as listed (case and hyphens matter): `Apache-2.0`, not "Apache 2".
- Knowledge note headers in this repo use SPDX ids for their sources; a source with no stated licence says
  "unconfirmed", never a guessed id.

## Limits
- The page does not explain `AND`, `OR` or `LicenseRef-` expressions; see the SPDX specification.
- The licence of the list data itself is not stated on the page: unconfirmed.
- An identifier names a licence; it does not decide compatibility. Combining licences is legal analysis.
