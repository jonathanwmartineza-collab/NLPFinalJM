# Tracking work with GitHub milestones

- Source: About milestones — https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones (accessed 2026-11-28)
- Supporting page: Creating and editing milestones for issues and pull requests — https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/creating-and-editing-milestones-for-issues-and-pull-requests (accessed 2026-11-28)
- Publisher: GitHub
- Licence: CC-BY-4.0 · Copy in repo: link only

Why this matters for delivery-lead: the repo lives on GitHub, and a milestone there is the simplest shared place
to hold one milestone's issues and pull requests with a due date and a visible percentage complete.

## Key facts
- A milestone tracks progress on a group of issues or pull requests in one repository.
- You can attach an issue or pull request to a milestone when you create it or later.
- A milestone page shows:
  - your description (overview, teams involved, projected dates);
  - the due date;
  - the completion percentage;
  - counts of open and closed issues and pull requests, and the list of each.
- New issues created from a milestone page join that milestone by default.
- Open items can be reordered by dragging to set priority.
- If a milestone has more than 500 open issues, its issues can no longer be prioritised.
- Create or edit: open the Issues or Pull requests tab, choose Milestones beside the search box, then New or Edit.
- Fields: title (required) and description (optional); descriptions render Markdown.
- Deleting a milestone does not change the issues or pull requests that were in it.

## How to apply it here
| Plan element (this agent) | Where it goes in GitHub |
| --- | --- |
| Milestone name (M0, M1, …) | Milestone title, e.g. "M2 NLP Lab tokeniser slice" |
| Goal, owner slug, Definition of Done | Milestone description (Markdown checklist) |
| Target date range | Due date set to the end of the range; range stated in the description |
| Deliverables | One issue or pull request each, attached to the milestone |
| Priority inside the milestone | Drag order of open items |
| Status | Completion percentage plus evidence links in the status report |
- Completion percentage counts closed items, not quality: Green still needs test output or a preview link.
- Keep each milestone to at most 6 deliverables, as the agent's small-batch rule says; the 500-issue limit
  will never be the constraint.
- Close items only when they meet the Definition of Done; reopening is honest, silent closing is not.
- Deleting a milestone keeps its issues, so a replan can delete and recreate milestones without losing work.
- The delivery-lead writes plans and status only; creating or editing milestones in the live repository is a
  change the user approves first.
- Weekly status template from a milestone page:
  - Done: closed items, each with its evidence link.
  - Next: the top three open items in drag order.
  - At risk: items past the due date, with owner and mitigation.
  - Decision needed: anything only the user can choose.

## Limits
- The pages do not say who may create milestones (permissions) or how to close one.
- The "About" page does not explain how milestones relate to GitHub Projects boards.
- Whether the 500-item limit applies to pull requests is not stated.
