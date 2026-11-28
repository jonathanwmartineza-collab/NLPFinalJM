# Design Tokens Format Module 2025.10: exact file rules

- Source: Design Tokens Format Module 2025.10 — https://www.designtokens.org/tr/2025.10/format/ (accessed 2026-11-28)
- Supporting: Design Tokens Color Module 2025.10 — https://www.designtokens.org/tr/2025.10/color/ (accessed 2026-11-28)
- Publisher: Design Tokens Community Group (a W3C Community Group)
- Licence: W3C Community Final Specification Agreement (no SPDX id; publisher's terms) · Copy in repo: link only

Why this matters for design-systems-lead: `web/src/styles/tokens.css` holds the site's colours,
spacing, radii and durations by hand. If those values move to a token file, it must validate against
the stable format so any tool can turn it into CSS custom properties.

## Status
- Dated 28 October 2025; the first stable version, published as a Final Community Group Report.
- Not a W3C Standard and not on the W3C Standards Track (the document also calls itself a Candidate
  Recommendation; treat it as a stable community report).
- `tr.designtokens.org/format/` now redirects to the editor's draft; cite the dated 2025.10 address.

## Tokens and groups
- A token is a JSON object with a required `$value`.
- Optional token properties: `$type`, `$description` (plain string), `$extensions` (vendor-keyed
  data), `$deprecated` (`true`, `false` or an explanation string).
- A group is an object without `$value`; it can hold tokens, groups, `$description`, `$type`,
  `$deprecated`, `$extensions` and `$extends`.
- `$root` is a reserved name for a group's base token; `$extends` inherits another group by deep merge.
- Type resolution order: the token's own `$type`, then the referenced token's type (for aliases),
  then the nearest parent group's `$type`. Otherwise the token is invalid. Tools must not guess
  types from values.

## Names
- Must not start with `$`; must not contain `{`, `}` or `.`.
- Case-sensitive (tools may warn when two names differ only by case).

## References
- Curly braces `{group.token}` point at a whole token and resolve to its `$value`.
- JSON Pointer `$ref` (RFC 6901) can reach inside a value, e.g. `#/colors/blue/$value/components/0`.
- Chains of aliases are allowed; circular references are errors.

## Types
- Simple: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`.
- Composite: `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`.
- `dimension`: `{ "value": 16, "unit": "px" }`; units `px` or `rem` only.
- `duration`: `{ "value": 150, "unit": "ms" }`; units `ms` or `s`.
- `cubicBezier`: four numbers; both x values must be within [0, 1].
- `fontWeight`: a number 1 to 1000 or a named alias such as `bold` (case-sensitive).

## Colour values (Color Module 2025.10)
- `$value` is an object: `colorSpace` (required), `components` (required array of numbers or
  `none`), `alpha` (optional, 0 to 1, default 1), `hex` (optional 6-digit CSS hex fallback).
- Colour spaces: `srgb`, `srgb-linear`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `display-p3`,
  `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz-d65`, `xyz-d50`.
- `none` differs from `0` when interpolating (for example an undefined hue).
- Example: `{ "colorSpace": "oklch", "components": [0.7016, 0.3225, 328.363], "alpha": 1, "hex": "#ff00ff" }`.

## Files
- JSON; media type `application/design-tokens+json` preferred, `application/json` must also be accepted.
- Extensions `.tokens` or `.tokens.json`.

## How to apply it here
- Map `tokens.css` primitives (e.g. `--accent: #2f5bd3`) to `color` tokens with `colorSpace: "srgb"`
  and a `hex` fallback; keep OKLCH ramps in `oklch` with hex fallbacks for older tools.
- Semantic tokens (`accent`, `ink`, `focus`, `err`) become aliases: `"$value": "{color.blue.600}"`.
- Put durations (`--t-fast: 150ms`, `--t: 220ms`) in a `duration` group and the easing
  `cubic-bezier(.2, .8, .2, 1)` in `cubicBezier`; x values 0.2 and 0.2 pass the [0, 1] rule.
- Radii and spacing become `dimension` in px; `999px` pills stay valid.
- Glass `rgba(...)` values: `srgb` components plus `alpha`.
- Set `$type` once on each group instead of on every token.
- Mark removals with `$deprecated: "Use {color.text.muted}"` before deleting a token.

## Limits
- The fetched text stopped inside the shadow section; `shadow`, `gradient` and `typography` shapes
  are UNVERIFIED here, so read the spec before writing them.
- The licence block names the Final Specification Agreement but mentions the Resolver Module; the
  wording mismatch is the publisher's.
- Theming across light/dark is covered by the separate Resolver Module, not read for this note.
