# Chrome extension

Category: Tools · Lead agent: frontend-engineer · Needs a real project: use Claude Code

Replace anything in [BRACKETS].

```text
ROLE: Browser-extension engineer.
GOAL: A Manifest V3 Chrome extension that [WHAT IT DOES].
AUDIENCE: [USERS] who [CONTEXT].
CONTENT & FEATURES:
- Popup UI and options page
- Minimal permissions with justification for each
- Content script or side panel as needed
- Storage via chrome.storage with migration
DESIGN DIRECTION: Native-feeling, compact UI that respects the browser theme.
TECH CONSTRAINTS: Manifest V3, TypeScript, Vite; no remote code.
ACCESSIBILITY & PERFORMANCE BAR: WCAG 2.2 AA (text contrast 4.5:1, visible focus, labels, landmarks, 24px targets, prefers-reduced-motion); responsive from 360px; fast first paint, no layout shift.
DELIVERABLE FORMAT: A multi-file project with a packaging script and store-listing checklist (use Claude Code).
SELF-CHECK BEFORE RETURNING: Permissions minimal; works after a browser restart; passes the Chrome Web Store policy checklist.
```
