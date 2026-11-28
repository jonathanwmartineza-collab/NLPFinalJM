# CSS custom properties: cascade, fallbacks and registered types

- Source: Using CSS custom properties (variables) — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties (accessed 2026-11-28)
- Publisher: MDN Web Docs (Mozilla)
- Licence: CC-BY-SA-2.5 (prose; code samples since 2010 are CC0-1.0) · Copy in repo: link only

Why this matters for design-systems-lead: the site's tokens ship as custom properties in
`web/src/styles/tokens.css`, remapped for dark mode (`prefers-color-scheme` and `[data-theme]`) and
high contrast. Knowing exactly how they inherit and fail stops silent theme bugs.

## Key facts: declaring and using
- Declare with two dashes, e.g. `--main-bg-color: teal;`, and read with `var(--main-bg-color)`.
- Names are case-sensitive: `--my-color` and `--My-color` are different properties.
- Values can be any valid CSS value; `var()` works anywhere in a property value but not in property
  names, selectors, or media/container query conditions.
- Declaring on `:root` is the common way to make a property global; any selector can scope one.
- Custom properties inherit by default: a child sees its nearest ancestor's value.
- Values are computed where used, so you cannot set a value on one element and read it from a
  sibling's descendant.

## Key facts: fallbacks
- `var(--x, red)` uses `red` when `--x` is undefined or invalid.
- Everything after the first comma is the fallback: `var(--foo, red, blue)` falls back to `red, blue`.
- Chain fallbacks by nesting: `var(--a, var(--b, pink))`. Writing `var(--a, --b, pink)` is invalid.
- Nested fallbacks have a performance cost.
- Fallbacks do not help browsers without custom-property support.

## Key facts: invalid values ("valid at computed time")
- Normal properties drop an invalid declaration and keep the earlier cascaded value.
- A custom property is accepted at parse time; it only fails when substituted into a property that
  rejects it. The property then takes its inherited value (if it inherits and a parent sets it) or
  its initial value. Example: `--text-color: 16px` used in `color` gives the initial colour, not the
  previous one.

## Key facts: registered properties
- An `@property --name { syntax: "<color>"; inherits: false; initial-value: teal; }` rule adds a
  type, an inheritance switch and an initial value.
- With `inherits: false`, a child does not take the parent's value; it gets `initial-value`.
- A registered property with a bad value falls back to `initial-value` instead of the
  property's default.
- JavaScript registration uses the CSS Properties and Values API.

## Key facts: JavaScript
- `el.style.getPropertyValue("--x")` reads an inline value; `getComputedStyle(el).getPropertyValue("--x")`
  reads the computed one; `el.style.setProperty("--x", value)` sets it.

## How to apply it here
- Keep primitives and semantics on `:root`; remap only semantic properties inside the dark and
  high-contrast blocks, never component rules.
- Give critical components a fallback to a semantic token, not a raw hex: `var(--focus, var(--accent))`.
- A typo in a token name fails silently (initial value); add a test or lint that every `var(--…)`
  in `app.css` and `nlp.css` names a property defined in `tokens.css`.
- Register colour tokens that are animated or must never be invalid with `@property` and
  `syntax: "<color>"`, choosing an `initial-value` that passes contrast.
- Read tokens in TypeScript with `getComputedStyle(document.documentElement)` so the theme toggle
  and charts share one source.
- Watch case: `--Accent` would be a new, empty token.

## Limits
- The page does not cover browser support tables for `@property`; check before relying on it.
- It does not discuss naming conventions, tiers or theming strategy; those come from the token
  format note and the shared tokens note.
