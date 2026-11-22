---
name: "release-gate"
description: "Use when a deliverable, plan or release must be approved: scores it against its requirements with pass / partial / fail, separates blockers from notes, and enforces the evidence rule (no check counts without its command and output)."
---
# Release gate

## Purpose
Decide honestly whether something is ready, with evidence a third person can verify.

## Procedure
1. Collect the requirements: the spec, acceptance criteria, the user's request. Number them.
2. For each requirement, find the evidence: a test output, a screenshot you actually opened, a file and line, a live URL check.
3. Score each: **pass** (evidence shows it), **partial** (works with gaps; say which), **fail** (missing or broken), **not run** (no evidence; never counts as pass).
4. Classify findings: **blocker** (unsafe, broken core flow, data loss, secret exposure, legal risk, accessibility failure on a core path) or **note**.
5. Verdict: ship only with zero blockers. Otherwise list the smallest set of fixes that clears them.
6. Re-check after fixes; at most 2 rounds, then report what is left.

## Checklist
- [ ] Every requirement has a score and an evidence pointer.
- [ ] Visual judgements were made after opening the screenshots or the page.
- [ ] Security, privacy and accessibility were checked, not assumed.
- [ ] Not-run items are labelled NOT RUN with the reason.
- [ ] The verdict is one line: SHIP, SHIP WITH NOTES, or BLOCKED.

## Output template
| # | Requirement | Score | Evidence | Note |
|---|---|---|---|---|
**Blockers:** … · **Notes:** … · **Verdict:** SHIP / SHIP WITH NOTES / BLOCKED
