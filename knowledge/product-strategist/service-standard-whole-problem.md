# Service Standard: solve a whole problem for users

- Source: 2. Solve a whole problem for users — https://www.gov.uk/service-manual/service-standard/point-2-solve-a-whole-problem (accessed 2026-11-28)
- Supporting page: Service Standard — https://www.gov.uk/service-manual/service-standard (accessed 2026-11-28)
- Publisher: Government Digital Service (GOV.UK Service Manual)
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for product-strategist: scope is the strategist's main lever. This point gives a tested rule for
sizing an MVP: neither too narrow nor too broad, shaped around how users think, and checked against what already
exists before anything new is built.

## Key facts
- Services that do not fit with related services make life hard for users.
- Do not build large, complicated services that try to do too much.
- The goal is not to fix everything at once; frequent, incremental improvements help users more.
- Each increment should move the journey toward one that makes sense to users, whoever owns each part.
- Users should not need to understand how the organisation behind a service is arranged.
- What teams should do:
  - Understand genuine constraints and work with the people who own them to resolve the problems they cause.
  - Scope the service around how users think and what they need to do: neither too narrow nor too broad.
  - Check whether someone has already solved the problem; reuse existing solutions, including AI ones.
  - Explain how the service fits with other services into one journey that solves the whole problem.
  - Consider options other than building a service: web content, a campaign, a partner, or open data.
  - Work in the open: publish research findings, journey maps, service maps and roadmaps.
  - Ask users for the same information as few times as possible, while respecting privacy.
- Design around user needs, not technologies or pre-selected solutions. The January 2026 update says this
  explicitly covers generative AI and off-the-shelf products.

### The 14 points (supporting page, titles in short)
1 Understand users and their needs · 2 Solve a whole problem · 3 Joined-up experience across channels ·
4 Simple to use · 5 Everyone can use it · 6 Multidisciplinary team · 7 Agile ways of working ·
8 Iterate and improve often · 9 Secure, protects privacy · 10 Define success, publish performance data ·
11 Right tools and technology · 12 Make new code open · 13 Open standards, common components and patterns ·
14 Operate a reliable service.

## How to apply it here
| Scope check | Question to ask | If the answer is no |
| --- | --- | --- |
| Whole job | Does the MVP let a visitor finish the job end to end? | Add the missing step, cut a nice-to-have |
| Not too broad | Is every Must story needed for the primary job? | Move it to Later with a reason |
| Reuse | Does a page, agent or NLP Lab tool already do this? | Extend it instead of building new |
| AI not the goal | Would the need stand without "AI" in the sentence? | Reframe around the user's job |
| Journey | Can you say what the visitor does before and after? | Map the journey first |
| Repeat asks | Do we ask the visitor for anything twice? | Remove the second ask |
- Treat "use the on-device model" as a constraint, not a feature; the feature is the visitor's job.
- With 36 agents, check overlap first: a new capability usually belongs inside an existing agent's lane.
- Point 9 (privacy) and point 5 (everyone can use it) become non-goals you never cut; send details to
  privacy-compliance and accessibility-specialist.

## Limits
- Written for UK public services; cross-government ownership advice maps loosely to a small team.
- The page has no phase-by-phase checklist and no assessor questions.
- Summaries of the other 13 points are not in the supporting page; read each point's own page when needed.
