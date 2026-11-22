---
name: "ui-polish-pass"
description: "Use when a screen works but doesn't feel finished: runs a concrete polish pass on spacing rhythm, type scale, alignment, hierarchy, states, focus, motion and dark mode, and returns precise fixes."
---
# UI polish pass

## Purpose
Turn "fine" into "crafted" with specific, small, high-impact changes.

## Procedure
1. Squint test: is there one clear focal point and primary action per screen? If not, reduce competing weights.
2. Spacing: snap every gap to the 4px scale; related items closer than unrelated ones (proximity); consistent section rhythm.
3. Type: at most 4 sizes per screen; line length 45–75 characters; headings balanced; no orphans in buttons.
4. Alignment: shared left edges; numbers right-aligned in tables; icons optically centred.
5. Colour: accent used only for actions and key data; neutral greys from one ramp; check dark mode for muddy greys and glare.
6. States: hover, active, focus-visible, disabled, loading, empty, error all designed and consistent.
7. Detail: consistent radius and shadow; hairlines at 1px; truncation with full text on hover/focus; no layout shift when content loads.
8. Motion: 150–250ms, ease-out, purposeful; respects reduced motion.

## Checklist
- [ ] One focal point per screen.
- [ ] All spacing on the scale; type limited to the scale.
- [ ] Every interactive element has visible focus and hover/active states.
- [ ] Dark mode reviewed screen by screen.
- [ ] No overflow at 360px; no layout shift on load.

## Output template
| Area | Issue | Fix (exact CSS or copy) | Impact (H/M/L) |
