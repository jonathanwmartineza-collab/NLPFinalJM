---
name: "motion-guidelines"
description: "Use when adding animation or micro-interactions: defines purposeful motion (feedback, orientation, continuity), durations, easing, choreography and reduced-motion fallbacks."
---
# Motion guidelines

## Procedure
1. Name the purpose of each motion: feedback (button press), orientation (where did this panel come from), continuity (list reorder), or delight (sparingly). No purpose, no motion.
2. Durations: micro feedback 100–150 ms; small transitions 200–250 ms; large panels 300–400 ms. Exits ~20% faster than entrances.
3. Easing: ease-out (decelerate) for entering, ease-in for leaving, standard ease-in-out for moving; avoid linear except progress.
4. Animate transform and opacity only (60 fps); avoid animating layout properties.
5. Choreography: stagger lists 20–40 ms per item, max ~8 items.
6. Reduced motion: under `prefers-reduced-motion: reduce`, replace movement with instant changes or simple fades; never auto-play parallax or large movement.
7. Loading: skeletons after 300 ms; spinners only for short unknown waits; show progress when known.

## Checklist
- [ ] Every animation has a stated purpose.
- [ ] Durations and easing come from tokens.
- [ ] Reduced-motion variant exists and was tested.
- [ ] Nothing flashes more than 3 times per second.

## Output template
| Element | Trigger | Purpose | Property | Duration | Easing | Reduced-motion |
