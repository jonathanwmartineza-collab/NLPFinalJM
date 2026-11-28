# Scrum Guide 2020: timeboxes, commitments and the Definition of Done

- Source: The 2020 Scrum Guide — https://scrumguides.org/scrum-guide.html (accessed 2026-11-28)
- Publisher: Scrum Guides (scrumguides.org)
- Licence: CC-BY-SA-4.0 · Copy in repo: link only

Why this matters for delivery-lead: the agent runs builds as milestones with a definition of done and honest
status. The Scrum Guide is the primary definition of those ideas (goal, increment, done), so plans here can use
the terms exactly as written instead of loosely.

## Key facts
- Edition: the 2020 guide (November 2020 version).
- Three pillars: transparency, inspection, adaptation.
- Five values: commitment, focus, openness, respect, courage.
- A Scrum Team is typically 10 or fewer people; bigger groups should split into several cohesive teams that
  share one Product Goal, one Product Backlog and one Product Owner.
- Accountabilities:
  - Developers: create the Sprint Backlog, follow the Definition of Done, adapt the plan daily toward the Sprint Goal.
  - Product Owner: maximises value and manages the Product Backlog; one person, not a committee.
  - Scrum Master: establishes Scrum and helps everyone understand and apply it.
- Timeboxes (maximums stated for a one-month Sprint):
  | Event | Maximum |
  | --- | --- |
  | Sprint | one month or less |
  | Sprint Planning | 8 hours |
  | Daily Scrum | 15 minutes |
  | Sprint Review | 4 hours |
  | Sprint Retrospective | 3 hours |
- Each artifact has one commitment: Product Backlog → Product Goal; Sprint Backlog → Sprint Goal;
  Increment → Definition of Done.
- The Definition of Done is a formal description of the quality an Increment must meet. Items that do not meet
  it cannot be released or shown at the Sprint Review; they go back to the Product Backlog.
- An Increment adds to earlier ones, is thoroughly verified and is usable. Several can be made in one Sprint,
  and one may be delivered before the Sprint ends: the Review is not a gate to releasing value.
- Only the Product Owner can cancel a Sprint, and only if its Sprint Goal becomes obsolete.

## How to apply it here
- Map terms to this repo's ladder: milestone ≈ Sprint with one goal; milestone goal ≈ Sprint Goal; the user (or
  product-strategist's spec) owns the Product Goal; the delivery-lead keeps the backlog ordered.
- One owner per milestone matches "one person, not a committee" for decisions.
- Use the same Definition of Done for every milestone, written once in the plan:
  - [ ] Acceptance criteria pass (Given/When/Then), with test output named.
  - [ ] Unit and e2e checks run, or marked NOT RUN with a reason (never counted as done).
  - [ ] Accessibility and privacy checks for changed pages are done.
  - [ ] Build passes locally; Deploy Preview link recorded.
  - [ ] Notes or README updated where behaviour changed.
- Work that misses the definition is not "90% done": move it back to the backlog and say so in status.
- Ship an Increment as soon as it is done and verified; batching for Netlify credits is a deploy choice, not a
  reason to call unverified work done.
- A milestone is cancelled only when its goal no longer makes sense, and the user decides that.
- Run a short retrospective after each milestone: one keep, one change, one owner.

## Limits
- The guide describes a framework, not a project plan: no estimates, no risk logs, no release checklists.
- Timeboxes assume a human team; agent sessions are much shorter, so treat the numbers as upper bounds.
- It does not cover tooling (issues, milestones, boards); see the GitHub milestones note.
