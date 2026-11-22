---
name: "one-shot-spec"
description: "Use when an idea must become a buildable spec before a one-shot build or a Claude Code project: turns a one-line brief into users, screens/sections, content, features, states, design tokens and acceptance criteria (JSON + short markdown)."
---
# One-shot spec

## Purpose
Remove guesswork before building. A good spec makes the build predictable and reviewable.

## Procedure
1. Restate the idea in one sentence: who it is for, the job it does, the moment they use it.
2. Choose the format: single page, multi-screen app, or "needs a real project" (APIs, auth, many files). Say which.
3. List sections or screens in order, each with purpose and the actual content (headlines, labels, sample data).
4. List features as verbs ("filter jobs by remote/hybrid"), each with its states: empty, loading, error, success.
5. Define design direction: mood in 3 words, palette (bg, ink, accent, accent-ink with contrast ≥ 4.5:1), font stack, radius, layout idea from the subject's world.
6. Write 5–10 acceptance criteria that a tester can check without asking you.
7. Note risks and assumptions (data you invented, features you cut).

## Checklist
- [ ] Every section has real content, not placeholders.
- [ ] Every interactive feature lists its states.
- [ ] Palette passes contrast in light and dark.
- [ ] Acceptance criteria are observable ("At 375px, the nav collapses into a menu button").
- [ ] Scope fits the chosen format; anything bigger is flagged for Claude Code.

## Output template
```json
{"title":"","audience":"","format":"single-page|multi-screen|project","sections":[{"id":"","purpose":"","content":""}],
 "features":[{"name":"","states":["empty","loading","error","success"]}],
 "design":{"mood":"","palette":{"bg":"","ink":"","accent":"","accentInk":""},"font":"","radius":"","layout":""},
 "acceptance":[""],"assumptions":[""]}
```
Then 3–6 lines of markdown: the idea, the format decision, the biggest risk.
