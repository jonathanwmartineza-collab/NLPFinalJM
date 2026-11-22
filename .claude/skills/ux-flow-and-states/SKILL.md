---
name: "ux-flow-and-states"
description: "Use when designing or reviewing how a product works: produces information architecture, task flows, and a state inventory (empty, loading, partial, error, success, offline, permission) with copy for each, checked against Nielsen's heuristics."
---
# UX flows and states

## Purpose
Design the whole experience, not just the happy path.

## Procedure
1. List the top 3–5 user tasks in priority order.
2. Information architecture: pages/screens and navigation; max 7±2 top-level items; name things in users' words.
3. For each task, draw the flow as numbered steps: entry point → decisions → completion → what happens next. Mark where users can go back or undo.
4. State inventory for every screen and component that shows data or takes input: empty (first use), loading (skeleton or progress after 300 ms), partial, error (what happened, what to do), success, offline, no permission, rate-limited.
5. Text wireframe each key screen (regions, hierarchy, primary action) — or HTML if asked.
6. Heuristic pass (Nielsen's 10): visibility of status, match to real world, user control, consistency, error prevention, recognition over recall, flexibility, minimalism, error recovery, help.
7. Edge cases: long names, zero/huge numbers, slow networks, keyboard-only, screen reader, small screens, RTL if relevant.

## Checklist
- [ ] Every task has a complete flow with exits and recovery.
- [ ] Every data view has empty, loading and error states with real copy.
- [ ] Primary action is obvious on every screen; destructive actions confirm or can be undone.
- [ ] Works at 360px and with a keyboard alone.

## Output template
## IA · ## Flows (numbered) · ## State inventory (table: screen · state · what the user sees · copy) · ## Wireframes · ## Heuristic findings (severity 0–4)
