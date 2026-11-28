# WCAG 2.2 conformance: what a claim covers and what changed in 2.2

- Source: Understanding Conformance — https://www.w3.org/WAI/WCAG22/Understanding/conformance (accessed 2026-11-28)
- Supporting: What's New in WCAG 2.2 — https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI)
- Licence: W3C Document License 2023 (no SPDX id; publisher's terms) · Copy in repo: link only

Why this matters for accessibility-specialist: audits of this site must say exactly what scope was
tested and must not overclaim. The site also loads third-party pieces (Pyodide from a CDN, the
WebLLM engine) that the authors do not control.

## Key facts: the five conformance requirements
1. Level: meet every criterion at that level and below (AA = all A and AA), or provide a conforming
   alternate version. Level A is the minimum.
2. Full pages: the whole page conforms; parts cannot be excluded. Linked supplements such as a long
   description count as part of the page. Each responsive variation must conform.
3. Complete processes: every page in a multi-step process conforms at the claimed level.
4. Only accessibility-supported ways of using technologies are relied on; anything offered another
   way must also be available in a supported way.
5. Non-interference: technologies not relied on must not block the rest of the page, whether on,
   off or unsupported. Four criteria apply to all content regardless: 1.4.2 Audio Control,
   2.1.2 No Keyboard Trap, 2.3.1 Three Flashes, 2.2.2 Pause, Stop, Hide.

## Key facts: claims
- Making a claim is optional; conformance does not need one.
- If made, a claim includes the date, the content covered (URI or pattern), the WCAG version and
  level, and the accessibility-supported technologies relied on.
- Optional parts: extra criteria met, technologies used but not relied on, the user agents and
  assistive technologies used for testing, extra steps taken.
- Techniques are sufficient, not mandatory; conformance is judged against the criteria.
- Requiring AAA site-wide is advised against, because some content cannot meet every AAA criterion.
- A statement of partial conformance covers third-party content outside the author's control; the
  rest of the page must conform, and it is a statement of non-conformance for that part.

## Key facts: WCAG 2.2 changes
- Published as a W3C Recommendation on 5 October 2023.
- 4.1.1 Parsing is obsolete and removed; otherwise the 2.0 and 2.1 criteria are essentially the same.
- New: 2.4.11 Focus Not Obscured (Minimum) AA; 2.4.12 Focus Not Obscured (Enhanced) AAA;
  2.4.13 Focus Appearance AAA; 2.5.7 Dragging Movements AA; 2.5.8 Target Size (Minimum) AA;
  3.2.6 Consistent Help A; 3.3.7 Redundant Entry A; 3.3.8 Accessible Authentication (Minimum) AA;
  3.3.9 Accessible Authentication (Enhanced) AAA.
- So an AA audit adds six new checks: 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8.

## How to apply it here
- Scope line in every report: pages tested (e.g. `/`, `/nlp`, `/library`, `/expert/<slug>`), each
  in light, dark and high-contrast themes and at 320 px, plus the date and WCAG 2.2 AA.
- Treat the chat and the live NLTK box as processes: load, type, run, read result, recover from error.
- List relied-on technologies: HTML, CSS, JavaScript, WAI-ARIA; list WebAssembly and WebGPU as
  used, and check non-interference when they are missing.
- Pyodide and the WebLLM model are third-party; if their own output fails, use a partial
  conformance statement, but the site's wrapper UI (buttons, status, errors) must conform.
- Always test 2.1.2, 2.2.2 and 2.3.1 on spinners and pulsing dots even in parts not relied on.
- Wording: "issues found in the tested scope", never "certified" or "fully compliant".

## Limits
- This is general information, not legal advice on any accessibility law.
- The Understanding page does not discuss 4.1.1 or backwards compatibility; those facts come from
  the What's New page.
- Full criterion text and exceptions (for example 2.5.8's) are in the Recommendation itself.
