---
name: "wcag-22-audit"
description: "Use when checking accessibility: audits a page or component against WCAG 2.2 AA with keyboard, screen-reader and automated (axe) checks, and reports each issue with criterion, severity, location and an exact fix."
---
# WCAG 2.2 AA audit

## Procedure
1. Automated: run axe (e.g. @axe-core/playwright) on every page and state; record violations by impact. Automated tools find roughly a third of issues, so continue manually.
2. Keyboard: Tab through everything; check order (2.4.3), visible focus (2.4.7), focus not obscured by sticky UI (2.4.11), no traps (2.1.2), skip link (2.4.1), dialogs trap and return focus.
3. Screen reader (NVDA/VoiceOver): landmarks, one h1 and logical headings (1.3.1), names/roles/values (4.1.2), live announcements for status (4.1.3), alt text (1.1.1).
4. Visual: text contrast 4.5:1 / large 3:1 (1.4.3); UI components and focus 3:1 (1.4.11); reflow at 320px without horizontal scroll (1.4.10); text spacing (1.4.12); 200% zoom (1.4.4).
5. Input: target size ≥ 24×24 px (2.5.8); dragging has a single-pointer alternative (2.5.7); labels in name (2.5.3).
6. Forms and auth: labels and instructions (3.3.2), errors identified and suggested (3.3.1, 3.3.3), no redundant entry (3.3.7), accessible authentication — no cognitive tests, allow paste and password managers (3.3.8); consistent help (3.2.6).
7. Motion: respects prefers-reduced-motion; nothing flashes more than 3 times per second (2.3.1).

## Checklist
- [ ] axe: 0 serious/critical on every page (evidence attached).
- [ ] Full keyboard path completed for core tasks.
- [ ] Screen-reader pass notes recorded.
- [ ] All 2.2 additions checked: 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8.

## Output template
| # | Criterion | Severity (blocker/major/minor) | Where | Problem | Exact fix | How verified |
