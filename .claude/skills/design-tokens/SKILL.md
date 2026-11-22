---
name: "design-tokens"
description: "Use when a product needs a consistent visual foundation: defines colour, type, spacing, radius, shadow and motion tokens in W3C Design Tokens-style JSON and CSS variables, with light and dark themes and verified contrast."
---
# Design tokens

## Purpose
One source of visual truth that code, design and docs all use.

## Procedure
1. Start from brand inputs (accent, mood). Build primitives: neutral ramp (10 steps), accent ramp, status colours (ok, warn, error, info).
2. Map primitives to semantic tokens: `color.bg`, `color.surface`, `color.ink`, `color.ink-soft`, `color.line`, `color.control-border`, `color.accent`, `color.accent-ink`, `color.focus`, status pairs.
3. Dark theme: remap semantic tokens, not components. Lighten accents until text contrast ≥ 4.5:1 on dark grounds.
4. Verify contrast: body text ≥ 4.5:1, large text ≥ 3:1, control borders and focus rings ≥ 3:1 (WCAG 1.4.3, 1.4.11). Record ratios.
5. Type: font stacks, 4–6 size steps with line-heights, weights. Spacing: 4px base (4, 8, 12, 16, 24, 32, 48, 64). Radius: sm/md/lg. Shadow: 1–2 recipes. Motion: durations 150/250/400ms, easing.
6. Emit JSON (`$type`, `$value`, aliases with `{color.accent}`) and CSS custom properties; never hard-code colours in components.

## Checklist
- [ ] Every colour pair used for text or controls has a recorded contrast ratio that passes.
- [ ] Dark theme defined for every semantic colour.
- [ ] No component uses a primitive directly.
- [ ] Token names describe purpose, not appearance ("accent", not "orange").

## Output template
```json
{"color":{"accent":{"$type":"color","$value":"#C2410C"},"accent-ink":{"$type":"color","$value":"#FFFFFF"}},"space":{"2":{"$type":"dimension","$value":"8px"}}}
```
```css
:root{--color-accent:#C2410C;--color-accent-ink:#fff}
@media (prefers-color-scheme:dark){:root{--color-accent:#FB923C;--color-accent-ink:#1C1917}}
```
| Pair | Light ratio | Dark ratio | Pass |
