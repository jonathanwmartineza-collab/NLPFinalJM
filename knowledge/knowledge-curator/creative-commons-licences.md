# Creative Commons licences: what each one allows

- Source: About CC Licenses — https://creativecommons.org/share-your-work/cclicenses/ (accessed 2026-11-28)
- Publisher: Creative Commons
- Licence: CC-BY-4.0 · Copy in repo: link only

Why this matters for knowledge-curator: many sources in knowledge/ are CC-licensed (MDN, OWASP, GitHub Docs,
Google's style guide, the Scrum Guide). The licence decides whether a note may only link, may quote briefly, or
could later store a copy, and what credit it must give.

## Key facts
- CC licences date from 2002; they sit between keeping every right and giving every right away.
- Four elements:
  - BY (Attribution): credit the creator.
  - SA (ShareAlike): adaptations must be shared under the same terms.
  - NC (NonCommercial): only uses not primarily aimed at commercial advantage or payment.
  - ND (NoDerivatives): no adaptations allowed.
- Six licences, most to least permissive:
  | Licence | Commercial use | Adaptations | Share alike |
  | --- | --- | --- | --- |
  | CC BY | yes | yes | no |
  | CC BY-SA | yes | yes | yes (same or compatible licence) |
  | CC BY-ND | yes | no (unadapted copies only) | — |
  | CC BY-NC | no | yes | no |
  | CC BY-NC-SA | no | yes | yes |
  | CC BY-NC-ND | no | no | — (most restrictive) |
- Every one of the six requires attribution.
- This page is itself under CC BY 4.0 unless noted.

## How to apply it here
| Source licence | What a note may do | Credit in the note |
| --- | --- | --- |
| CC BY (any version) | Summarise, quote briefly; a stored copy would be allowed with credit | Title, publisher, URL, licence id |
| CC BY-SA | Same, but an adapted copy must carry the same licence | Same, plus say an adapted copy keeps BY-SA |
| CC BY-ND | Summarise in own words; a stored copy must be unadapted | Same |
| Any NC | Summarise; check before any commercial reuse of the site | Same, and flag to privacy-compliance |
| No licence stated, or proprietary | Link and summarise in own words only | Licence: "proprietary (publisher's terms)" or "unconfirmed" |
- In this round all notes are "Copy in repo: link only", so the credit line in the header is the attribution.
- Notes are written in our own words with at most one short quote, which keeps them summaries, not copies.
- Record the version too: CC BY 3.0 (OWASP Top 10) and CC BY-SA 2.5 (MDN prose) are not the 4.0 licences.
- When a later round downloads copies, re-check the licence on the day of download and store it beside the copy.
- The Open Government Licence (OGL-UK-3.0) is not one of the six CC licences; record its own SPDX id and
  read its own terms before storing copies.
- Audit check per folder: every Licence line is an SPDX id, "proprietary (publisher's terms)" or
  "unconfirmed", and any NC or ND source is listed in the curator's report.

## Limits
- The page does not cover CC0, the Public Domain Mark, licence layers or attribution formats in detail.
- It does not say how CC licences apply to software; code licences (MIT, Apache-2.0) are recorded by SPDX id.
- Whether a summary is an "adaptation" is a legal question the page does not answer; own-words summaries with
  short quotes are this repo's working rule, not CC advice.
