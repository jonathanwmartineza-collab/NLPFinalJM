# Tabs and disclosure: keyboard and ARIA patterns for panel switching

- Source: Tabs Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (accessed 2026-11-28)
- Supporting: Disclosure (Show/Hide) Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI), ARIA Authoring Practices Guide (APG)
- Licence: W3C Software and Document License (the page footer's "permissive license" link; see also W3C's Permission to Use WAI Material) · Copy in repo: link only

Why this matters for ux-architect: the /nlp page switches between NLTK and spaCy panels and hides
optional detail (parse trees, raw JSON, "how this works"). Choosing tabs versus disclosure, and
writing the behaviour into the flow spec, decides how keyboard and screen-reader users move through it.

## Key facts: tabs
- A tabbed interface is a set of tabs plus their tab panels; only one panel shows at a time.
- On load, one panel is displayed and its tab is marked active; activating another tab hides the
  previous panel and shows the new one.
- Roles: `tablist` (container), `tab` (each tab, inside the tablist), `tabpanel` (each content area).
- Label the tablist with `aria-labelledby` (visible label) or `aria-label` (no visible label).
- Each tab: `aria-controls` points to its panel; `aria-selected="true"` on the active tab, `false` on the rest.
- Each panel: `aria-labelledby` points back to its tab.
- Optional: `aria-orientation="vertical"` on a vertical tablist (default is horizontal);
  `aria-haspopup` (`menu` or `true`) when a tab has a popup menu.
- If a panel has no focusable content, or its first content element is not focusable, give the panel
  `tabindex="0"` so it is in the tab sequence.

## Key facts: tab keyboard model
- Tab moves focus into the tablist onto the active tab; Tab again leaves to the next focusable
  element, usually the panel.
- Left/Right Arrow (horizontal) move to the previous/next tab and wrap at both ends.
- Up/Down Arrow act like Left/Right only in a vertical tablist; a horizontal tablist ignores them so
  the page can still scroll.
- Space or Enter activates the focused tab when activation is not automatic.
- Home and End (optional) jump to the first and last tab.
- Shift+F10 opens a tab's popup menu if it has one; Delete (optional) closes a deletable tab and
  moves focus to the following tab, or the preceding one if none follows.

## Key facts: automatic versus manual activation
- Automatic: a panel shows as soon as its tab gets focus. APG recommends it only when panels
  appear without noticeable latency, which usually means the content is preloaded.
- Manual: arrows move focus only; Space or Enter shows the panel. Use it when a panel is slow to
  load, so moving between tabs stays fast.

## Key facts: disclosure (show/hide)
- Two parts: a button and the section whose visibility it controls.
- The control has role `button`; `aria-expanded="true"` when the content is visible, `false` when hidden.
- `aria-controls` on the button, pointing to the content, is optional.
- Enter and Space toggle the content. Visual convention: arrow points right when closed, down when open.
- APG examples include image description, FAQ answers, navigation menus and a card.

## How to apply it here
| Situation on the site | Pattern | Activation |
|---|---|---|
| NLTK vs spaCy panels built from static JSON (already loaded) | Tabs | Automatic is fine |
| A panel that waits on the Pyodide worker or a fetch | Tabs | Manual (Enter/Space) |
| "Show parse details", "Show raw JSON", long text alternative of a diagram | Disclosure | n/a |
| Several independent show/hide sections | Disclosure per section (not tabs) | n/a |
- In the state inventory, write the default tab, the tab focus order and what each panel shows
  while loading, on error and when empty.
- Spec the tab/disclosure state names so the frontend can map them to `aria-selected` and `aria-expanded`.
- Never nest the live NLTK box's Analyze button inside a tab label; one control, one job.
- Hand formal conformance checks of the built widget to the accessibility specialist.

## Limits
- APG pages are informative guidance on using ARIA 1.2; they are not WCAG success criteria.
- The pages say nothing about mobile or touch behaviour, URL/hash syncing of the selected tab, or
  persisting the last-open tab; those are design decisions to record as ASSUMPTION.
- Neither page gives a recommended maximum number of tabs.
