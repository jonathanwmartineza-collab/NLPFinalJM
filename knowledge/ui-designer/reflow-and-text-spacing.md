# Layouts that survive 400% zoom and user text-spacing overrides

- Source: Understanding SC 1.4.10 Reflow — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html (accessed 2026-11-28)
- Supporting: Understanding SC 1.4.12 Text Spacing — https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI)
- Licence: W3C Software and Document License (the page footer's "permissive license" link; see also W3C's Permission to Use WAI Material) · Copy in repo: link only

Why this matters for ui-designer: grids, type scales, pill buttons with fixed heights and wide
tables (token tables, dependency parses, bigram lists) are visual decisions that break first when a
visitor zooms or widens line spacing.

## Key facts: reflow (1.4.10, Level AA)
- Content must work without two-dimensional scrolling at a width of 320 CSS px (vertical-scrolling
  content) or a height of 256 CSS px (horizontal-scrolling content).
- 320 px = a 1280 px wide viewport at 400% zoom; 256 px = a 1024 px tall viewport at 400%.
- Exception: only the parts that need two-dimensional layout for use or meaning, such as maps,
  diagrams, video, games, presentations, data tables, and toolbars that must stay visible while editing.
- For tables the exception covers the table, not its surroundings: headings, search fields and
  pagination near it must still reflow. Putting the table in its own scroll container helps.
- Indentation in code and nested lists can carry meaning; keep it, but shrink the indent at high zoom (G224).
- Sticky headers and footers can cover content and the focused element at high zoom; make them
  static on small viewports or let people toggle them (advisory C34).
- Failure F102: content disappears or becomes unavailable after reflow.
- Sufficient techniques include media queries plus CSS grid (C32), flexbox (C31), letting long URLs
  and strings wrap (C33), width/max-width for labels and inputs (C38), and keeping horizontal panels
  within 320 px (G225).

## Key facts: text spacing (1.4.12, Level AA)
- No loss of content or function when a person sets all of: line height 1.5 x font size,
  paragraph spacing 2 x font size, letter spacing 0.12 x font size, word spacing 0.16 x font size.
- You do not have to use these values, only survive them.
- Truncation with an ellipsis passes only if the full text can still be reached (on focus, on
  activation or on a linked page).
- Failure F104: text clipped or overlapping after the override. Advisory C28: size text
  containers in `em`.
- Languages that do not use one of the properties are judged on the properties they use.

## How to apply it here
- Grid: let the sidebar and main column stack below about 640 px; check the layout at exactly
  320 px wide and at 1280 px with 400% zoom.
- Buttons and chips: use `min-height`, never fixed `height`, so the 44 px pills grow when line
  height rises to 1.5.
- Long tokens, URLs and model names in chat and code blocks: allow wrapping (`overflow-wrap: anywhere`)
  or a horizontal scroll inside the code block only.
- Dependency-parse and token tables: wrap each in its own scroll region with a visible label and
  keyboard focus; the page around it must still reflow.
- Sticky composer or header: test that it does not hide the focused field at 400%.
- Type scale: keep body line height near 1.5 so the override changes little; avoid clipping
  containers (`overflow: hidden`) around text.
- Quick test: apply the four spacing values with a bookmarklet or devtools stylesheet and look
  for clipped or overlapping text in light and dark themes.

## Limits
- Neither page sets breakpoints, grid columns or a type scale; those remain design choices.
- The pages do not define how much horizontal scroll is acceptable inside an excepted table.
- Formal pass/fail calls belong to the accessibility specialist.
