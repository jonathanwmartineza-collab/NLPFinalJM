# Design tokens and theming
Why this matters: consistent, themeable, accessible visuals come from tokens, not hard-coded values.

## Structure
- Primitives (raw palette, sizes) → semantic tokens (bg, surface, ink, ink-soft, line, control-border, accent, accent-ink, focus, ok/warn/error) → component tokens only if needed.
- W3C Design Tokens Community Group format: JSON objects with `$value` and `$type` (color, dimension, fontFamily, fontWeight, duration, cubicBezier, shadow …); aliases reference other tokens with `{group.token}`.
- Emit CSS custom properties; components use only semantic variables.

## Dark mode
- Remap semantic tokens under `@media (prefers-color-scheme: dark)` and an explicit `[data-theme="dark"]` toggle.
- Avoid pure black/white; use deep warm/cool greys; lighten accents until text on them or them on the ground passes contrast.

## Contrast rules
- Text 4.5:1 (large 3:1); control borders, focus rings and meaningful icons 3:1 (WCAG 1.4.3, 1.4.11).
- Record the ratio for every text/background pair in the token docs.

## Scales
- Spacing 4px base: 4, 8, 12, 16, 24, 32, 48, 64. Radius sm 6–8, md 10–12, lg 16. Type: 4–6 steps with line-heights (1.05 display, 1.2 headings, 1.5–1.6 body).
- Motion: 150 / 250 / 400 ms; ease-out for entering.

Sources: https://www.designtokens.org/ and https://tr.designtokens.org/format/ (accessed 2026-11-21); https://www.w3.org/TR/WCAG22/ (accessed 2026-11-21)
