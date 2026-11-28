# Contrast maths for text, controls, focus rings and chart marks

- Source: Understanding SC 1.4.3 Contrast (Minimum) — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (accessed 2026-11-28)
- Supporting: Understanding SC 1.4.11 Non-text Contrast — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI)
- Licence: W3C Software and Document License (the page footer's "permissive license" link; see also W3C's Permission to Use WAI Material) · Copy in repo: link only

Why this matters for ui-designer: the site uses frosted-glass panels over a colour field, an accent
blue, and coloured entity and sentiment chips on /nlp. Every pair has to be computed, not eyeballed,
in light, dark and high-contrast themes.

## Key facts: text (1.4.3, Level AA)
- Normal text: at least 4.5:1. Large-scale text: at least 3:1.
- Large-scale = at least 18 pt, or 14 pt bold; about 24 CSS px and 18.5 CSS px bold (1 pt = 1.333 px).
- Thresholds are not rounded: 4.499:1 fails 4.5:1.
- Applies to placeholder text and to text shown on hover or focus.
- Exceptions: text in an inactive (disabled) control, pure decoration, invisible text, text inside a
  picture with significant other visual content, and logotypes (text in a logo or brand name).
- Formula: (L1 + 0.05) / (L2 + 0.05), L1 = lighter colour's relative luminance; range 1:1 to 21:1.
- Relative luminance: L = 0.2126 R + 0.7152 G + 0.0722 B, each channel first linearised:
  c = value/255; if c <= 0.04045 then c/12.92, else ((c + 0.055)/1.055)^2.4.
- Specifying a text colour without a background colour (or the reverse) is failure F24; text over a
  background image without enough contrast is F83.
- A thin outline around letters counts as part of the letter; a wide halo filling the counters
  counts as the background.
- Anti-aliasing can make thin fonts look fainter than their CSS colour: heavier weights or a
  stronger pair are encouraged.

## Key facts: non-text (1.4.11, Level AA)
- At least 3:1 against adjacent colours for (a) visual cues needed to identify a control and its
  state, and (b) parts of graphics needed to understand the content. 2.999:1 fails.
- Exempt: inactive controls; controls styled entirely by the browser; graphics whose particular
  presentation is essential (photos, flags, heat maps); decorative graphics.
- Measure against the colours that touch the component; ignore minor shadows or thin borders that
  do not affect identification.
- Focus indicator: 3:1 against what it sits on (outside ring vs page background; inside ring vs the
  component's own colour). Removing focus outlines is failure F78.
- Author hover effects need not reach 3:1, but the control must not lose its base contrast.
- State marks (check mark, menu arrow, selected tab underline) must reach 3:1.
- Charts: lines and slices needed to read values need 3:1, unless the values are also given as
  text; text inside graphics follows 1.4.3. For gradients, test the weakest area.

## How to apply it here
- Glass panels: compute text contrast against the most tinted point the panel can sit on (and the
  opaque fallback), not against the average.
- Accent buttons: record accent vs accent-ink as a text pair (4.5:1) and accent vs panel as a
  boundary pair (3:1).
- Entity and sentiment chips on /nlp: chip text vs chip fill at 4.5:1; chip fill vs panel at 3:1
  only if the fill is the only edge; the label text itself carries meaning, not the hue.
- Focus ring token: 3:1 against both the panel and the accent button it may surround.
- Disabled controls are exempt, but they must still read as disabled; never use the exemption for
  controls that work.
- Publish each pair as "foreground / background = ratio, target" for the design systems lead.

| Element | Target |
|---|---|
| Body and label text | 4.5:1 |
| Text 24 px+ or 18.5 px+ bold | 3:1 |
| Input and ghost-button borders | 3:1 |
| Focus ring | 3:1 |
| Chart line, bar, legend swatch (no text value) | 3:1 |

## Limits
- The pages give no rule for semi-transparent colours or gradients behind text beyond "test the
  least contrasting area"; compute against the worst-case composite.
- WCAG 2.x maths does not model perceptual contrast for very light or very thin type; treat passing
  ratios as a floor.
- Level AAA enhanced contrast (7:1) is a separate criterion not covered here.
