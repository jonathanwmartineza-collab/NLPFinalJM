# Text alternatives (1.1.1) and not relying on colour (1.4.1) for NLP visuals

- Source: Understanding SC 1.1.1 Non-text Content — https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html (accessed 2026-11-28)
- Supporting: Understanding SC 1.4.1 Use of Color — https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI)
- Licence: W3C Document License 2023 (no SPDX id; publisher's terms) · Copy in repo: link only

Why this matters for accessibility-specialist: the /nlp page draws entity chips, sentiment badges,
frequency bars and dependency parses. Each needs a text equivalent, and none may carry meaning by
hue alone.

## Key facts: 1.1.1 Non-text Content (Level A)
- All non-text content has a text alternative that serves the equivalent purpose, unless an
  exception applies.
- Exceptions: controls and inputs (a name describing purpose); time-based media (at least
  identify it); tests that would be invalid as text (describe the purpose); sensory experiences
  (a descriptive label); CAPTCHA (describe purpose and offer another sense); decoration,
  formatting or invisible content (make it ignorable by assistive technology).
- Short alternative only when it conveys everything (G94). Charts and diagrams need a short
  description (G95) plus a long description (G73, G74, G92 or ARIA15); for charts, summarise the
  trends and give the data in a table where practical.
- Short-alternative techniques include `aria-label` (ARIA6), `aria-labelledby` (ARIA10) and `alt` (H37).
- Decorative images: null `alt` (H67) or CSS backgrounds (C9).
- Failures: F3 (information only in CSS background images), F13 (chart relies on colour), F20 (text
  alternative not updated when content changes), F30 (filename or placeholder as alt), F38/F39
  (decorative image not ignorable, or given text like "spacer"), F65 (missing `alt`), F67 (long
  description does not match), F71 (text look-alikes), F72 (ASCII art without alternative).

## Key facts: 1.4.1 Use of Color (Level A)
- Colour is not the only visual means of conveying information, indicating an action, prompting a
  response or distinguishing a visual element.
- It covers colour perception only; programmatic exposure is under 1.3.1 and 4.1.2.
- A lightness difference counts as another visual cue only at 3:1 or more; when people must tell
  specific hues apart, add another indicator (text, shape, pattern).
- Inline links distinguished only by colour need 3:1 against surrounding text (G183), plus a
  further cue; changing presentation on focus is advisory (C15).
- Failures: F13 (colour-only chart), F73 (links not evident without colour vision), F81 (required
  or error fields marked only by colour).

## How to test here
| /nlp element | Pass condition |
|---|---|
| Entity chips (ORG, PRODUCT, TECH...) | Label text visible on each chip; legend not needed to decode hue |
| Sentiment badges | Words "positive / neutral / negative" plus the compound score |
| Frequency and bigram bars | Count shown as text, or a data table alternative |
| Dependency parse diagram | Short label plus a long alternative: a token table (word, lemma, POS, relation, head) |
| Decorative glass blobs and icons | `aria-hidden` or empty `alt`; not read |
| Inline links in help text | Underlined, or 3:1 with text plus non-colour focus cue |
- Re-run the alternative check after the live box updates results (F20): the text must match the new output.
- Grayscale test: switch the OS or devtools to grayscale and confirm every distinction survives.

## Limits
- The pages do not define how long a long description should be or where to place it; a
  disclosure next to the diagram or a table under it are both acceptable patterns.
- Contrast thresholds for text and graphics are 1.4.3 and 1.4.11, not these criteria.
