# prefers-reduced-motion: detecting and honouring the setting

- Source: prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion (accessed 2026-11-28)
- Publisher: MDN Web Docs (Mozilla)
- Licence: CC-BY-SA-2.5 (prose; code samples since 2010 are CC0-1.0) · Copy in repo: link only

Why this matters for motion-designer: the site animates pills, rows, the theme switch, a spinner
in the NLP Lab (`.nlp-spin`) and pulsing "thinking" dots (`.dots`). Every one needs a reduced
variant that keeps the feedback and drops the movement.

## Key facts
- The media feature detects whether the person turned on an OS or browser setting to minimise
  non-essential motion.
- Values: `no-preference` (no setting; evaluates false) and `reduce` (setting on; evaluates true).
- `(prefers-reduced-motion)` with no value means the same as `(prefers-reduced-motion: reduce)`.
- Status: Baseline "widely available", working across browsers since January 2020.
- Defined in Media Queries Level 5. A matching client hint header exists:
  `Sec-CH-Prefers-Reduced-Motion`.
- The concern: scaling or panning large objects can trigger vestibular motion disorders.
- The suggested replacement is a gentler effect such as an opacity change (dissolve).
- MDN's example swaps a scaling `pulse` keyframe for an opacity-only `dissolve` keyframe; the
  reduced rule comes later in the stylesheet with the same specificity, so it wins.

## Where people turn it on (for test plans)
- Windows 11: Settings > Accessibility > Visual Effects > Animation Effects.
- Windows 10: Settings > Ease of Access > Display > Show animations in Windows.
- macOS up to 15: System Settings > Accessibility > Display > Reduce motion; macOS Tahoe onwards:
  Accessibility > Motion > Reduce motion.
- iOS: Settings > Accessibility > Motion. Android 9+: Settings > Accessibility > Remove animations.
- Firefox: `about:config` number pref `ui.prefersReducedMotion` = 1 (reduce) or 0; applies at once.
- GNOME: Settings > Accessibility > Seeing > Reduced animation. KDE Plasma: animation speed "Instant".

## Two ways to write it
```css
/* 1. Motion by default, reduce on request */
.row { transition: transform var(--t-fast) var(--ease); }
@media (prefers-reduced-motion: reduce) { .row { transition: none; } }

/* 2. No motion by default, add it only when nobody asked to reduce */
@media (prefers-reduced-motion: no-preference) { .row { transition: transform var(--t-fast) var(--ease); } }
```

## How to apply it here
| Animation | Reduced variant |
|---|---|
| Hover/press lift on `.btn`, `.row`, `.chip-btn` (transform) | Keep colour and border change, drop transform |
| Theme switch knob slide | Instant position change; colour still changes |
| `.nlp-spin` spinner (already `animation: none`) | Static ring plus the visible "Loading..." text |
| `.dots` pulsing "thinking" dots | Opacity fade or a static "Thinking..." label |
| Panel and message entrances | Opacity only, no slide or scale |
| Glass blur and colour field | Static; no drifting background |
- Put the reduced block next to each animation, or in one block at the end of each stylesheet, so
  it wins on source order.
- In TypeScript, read the same query before starting script-driven motion
  (`window.matchMedia("(prefers-reduced-motion: reduce)")`).
- Test with the Firefox pref or devtools emulation in both themes.

## Limits
- The MDN page shows no JavaScript example; the `matchMedia` call above is the standard way to
  evaluate any media query in script, not something this page documents.
- The page lists the settings that set the preference but not exact behaviour in each browser.
- What counts as "non-essential" motion is a design judgement; see the WCAG motion note.
