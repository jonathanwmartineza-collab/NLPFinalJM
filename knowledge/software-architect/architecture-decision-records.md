# Architecture Decision Records (the original ADR format)

- Source: Documenting Architecture Decisions — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions (accessed 2026-11-28)
- Publisher: Cognitect (blog post, 15 November 2011)
- Licence: CC0-1.0 (public-domain dedication stated on the page) · Copy in repo: link only

Why this matters for software-architect: the agent records every non-default choice as an ADR, and this
repo keeps them in `docs/adr/` (0001 to 0008). This post is where the format comes from, so it settles
what an ADR must hold and how to change one.

## Key facts
- Problem: teams lose the reason behind past decisions. Newcomers then accept them blindly or reverse
  them blindly. Large design documents go stale; small, modular records do not.
- What gets a record: "architecturally significant" decisions, those affecting structure,
  non-functional characteristics, dependencies, interfaces or construction techniques.
- Where: in the project repository, as lightweight markup (Markdown or Textile); the post's path is
  `doc/arch/adr-NNN.md`.
- Numbering: sequential and monotonic; numbers are never reused.
- Reversed decisions are kept, marked superseded (or deprecated), and point to the replacement.
- Sections of one record:
  - Title: a short noun phrase.
  - Context: the forces at play (technical, political, social, project-local), stated as facts in
    value-neutral language, including where forces pull against each other.
  - Decision: the response, in full sentences, active voice, usually starting "We will…".
  - Status: proposed (not yet agreed) or accepted; later deprecated or superseded with a reference.
  - Consequences: the resulting context, listing negative and neutral effects, not just the good ones.
- Length: one or two pages. Write as a conversation with a future developer, in full sentences and
  paragraphs; bullets only for layout, never instead of sentences.
- Experience reported: used on several projects from early August 2011; every developer who rotated
  through said the context was valuable. Especially useful for recording long-term intentions, such as a
  planned future re-architecture.

## How to apply it here
- Next record: `docs/adr/0009-<short-noun-phrase>.md`; never renumber or reuse 0001 to 0008.
- Keep the repo's existing header line `Date: YYYY-MM-DD · Status: accepted` and the Context, Decision,
  Consequences headings (they match the post).
- Write a new ADR when a change would break a standing design choice, for example:
  - adding any server code or Netlify Function (reverses ADR 0005, static on-device AI);
  - moving spaCy from build time into the browser;
  - changing how the Studio turns model output into pages (ADR 0008).
- Superseding: add a new ADR with the new decision, then edit only the old one's Status to
  `superseded by 0009`. Never delete or rewrite the old Context.
- Consequences must name the cost of reversing the decision and at least one downside.
- Context lists the forces with numbers where they exist (bundle size, model download size, Netlify
  build time), each with its source and date.
- Decision sentences start "We will…"; one decision per record.

## Limits
- The post gives no template for options considered; the agent's own rule adds "options rejected", which
  fits inside Context or Consequences.
- 2011 tooling remarks in the post (where records were hosted) are dated and not guidance.
- It does not say who approves a status change; the repo's ADRs record only the status, so name the
  approver in the Context when it matters.
