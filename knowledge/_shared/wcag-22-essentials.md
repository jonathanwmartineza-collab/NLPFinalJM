# WCAG 2.2 AA essentials
Why this matters: every BrainyApp build must be usable by keyboard, screen-reader, low-vision and motor-impaired users. WCAG 2.2 became a W3C Recommendation in October 2023.

## Checks that catch most real failures
- Text contrast ≥ 4.5:1; large text (24px, or 18.66px bold) ≥ 3:1 (1.4.3).
- UI component boundaries, states and focus indicators ≥ 3:1 against adjacent colours (1.4.11).
- Reflow: usable at 320 CSS px wide without two-dimensional scrolling (1.4.10); text spacing overrides don't break layout (1.4.12).
- Everything works with a keyboard (2.1.1), no keyboard traps (2.1.2), logical focus order (2.4.3), visible focus (2.4.7).
- 2.4.11 Focus Not Obscured (Minimum, new in 2.2): the focused element isn't fully hidden by sticky headers, banners or drawers.
- 2.5.7 Dragging Movements (new): anything done by dragging also works with single clicks/taps.
- 2.5.8 Target Size (Minimum, new): pointer targets at least 24×24 CSS px, or enough spacing.
- 3.2.6 Consistent Help (new): help links/contact appear in the same place across pages.
- 3.3.7 Redundant Entry (new): don't make people re-type information they already gave in the same process.
- 3.3.8 Accessible Authentication (Minimum, new): no cognitive tests to log in; allow paste and password managers.
- Names, roles, values exposed to assistive tech (4.1.2); status messages announced without moving focus (4.1.3).
- One h1, landmarks (header/nav/main/footer), labelled form fields with errors described in text (1.3.1, 3.3.1, 3.3.2).
- Respect prefers-reduced-motion; nothing flashes more than 3 times per second (2.3.1).

## How to test
1. Automated: axe (e.g. @axe-core/playwright) on every page and theme. Automated tools find only part of the issues.
2. Keyboard-only pass through every core task.
3. Screen reader (NVDA on Windows, VoiceOver on macOS/iOS) for headings, landmarks, forms, live updates.
4. Zoom to 200% and resize to 320px.

Sources: https://www.w3.org/TR/WCAG22/ (accessed 2026-11-21); https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ (accessed 2026-11-21)
