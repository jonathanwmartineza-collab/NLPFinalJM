# The viewport meta tag on phones

- Source: `<meta name="viewport">` — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport (accessed 2026-11-28)
- Publisher: Mozilla (MDN Web Docs)
- Licence: CC-BY-SA-2.5 (or any later version; code samples CC0), per MDN's attribution and licensing page · Copy in repo: link only

Why this matters for mobile-engineer: every page must lay out at phone width, keep pinch-zoom, handle
notches, and behave sensibly when the on-screen keyboard opens (the chat box and the NLP live box both
take typing). The viewport tag controls all four.

## Key facts
- Syntax: `content` is a comma-separated list of `key=value` pairs.
- `width`: 1 to 10000 or `device-width`; sets the layout viewport's minimum width and the `vw` basis.
- `height`: 1 to 10000 or `device-height`; sets the `vh` basis.
- `initial-scale`: 0.0 to 10.0. Often added but usually unnecessary; without it the browser may zoom out
  when content overflows. Add `initial-scale=1` to start at 100 % zoom, and avoid horizontal overflow.
- `minimum-scale` / `maximum-scale`: 0.0 to 10.0; min must be ≤ max. Browsers may ignore them, and
  iOS 10 and later ignores them by default.
- `user-scalable`: `yes` (default) or `no`. `no` blocks people with low vision from reading the page.
  WCAG requires at least 2× zoom; best practice is to support 5×.
- `interactive-widget`: what an on-screen keyboard resizes.
  - `resizes-visual` (default): only the visual viewport; page layout does not change.
  - `resizes-content`: the layout viewport too, so the layout adapts to the keyboard.
  - `overlays-content`: neither; the keyboard covers content.
- `viewport-fit`: `auto` (whole page viewable), `contain` (largest inscribed rectangle), `cover` (fill
  the display). `cover` can put content under notches and cutouts, so pair it with CSS safe-area
  `env()` insets.
- Without the tag, some phones lay the page out on a wider virtual viewport (the page's example is
  980 px) and shrink it, so narrow media queries never match.
- Basic tag recommended on the page: `<meta name="viewport" content="width=device-width" />`.

## How to apply it here
- `web/index.html` has `width=device-width, initial-scale=1.0`: correct; keep it.
- Never add `maximum-scale=1` or `user-scalable=no`; iOS 10+ ignores them anyway, and they fail the
  2× zoom requirement everywhere else.
- Chat and NLP text boxes near the bottom: if the keyboard hides the input or send button, try
  `interactive-widget=resizes-content` and test on Android Chrome; check that sticky footers still fit.
- Edge-to-edge layout: only with `viewport-fit=cover` plus
  `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)`
  on the shell.
- Media queries only work as written once the tag is present; without it a 980 px layout makes phone
  breakpoints dead code.
- Test at 320 CSS px with no horizontal scroll (the front end's reflow rule) and at 200 % zoom.
- `sandbox.html` (Studio previews) and `404.html` in `web/public/` already carry the same basic tag;
  keep it in any new static HTML page.

## Limits
- MDN describes the keys; browser support per key (for example `interactive-widget`) needs a separate
  compatibility check (UNVERIFIED here).
- The page does not define the `env()` inset names; they come from the CSS specifications.
- The 980 px figure is an example, not a fixed default.
