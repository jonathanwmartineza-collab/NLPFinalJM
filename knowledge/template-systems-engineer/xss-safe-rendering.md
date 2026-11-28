# Rendering model output safely (OWASP XSS Prevention)

- Source: Cross Site Scripting Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html (accessed 2026-11-28)
- Publisher: OWASP Foundation (OWASP Cheat Sheet Series)
- Licence: CC-BY-SA-4.0 (stated on the page) · Copy in repo: link only

Why this matters for template-systems-engineer: the Studio renderer (`web/src/ai/studio/render.ts`)
turns model-written strings into one HTML page. The model is untrusted input, so the renderer must encode
every value for the exact place it lands. This cheat sheet lists those places and their rules.

## Key facts
- Baseline: frameworks auto-escape; their escape hatches (React's `dangerouslySetInnerHTML`, Lit's
  `unsafeHTML`, and similar) switch that off. A hand-written string renderer has no auto-escape at all.
- HTML body text: entity-encode `&`, `<`, `>`, `"` and `'`. In the DOM, `textContent` needs no
  pre-encoding.
- HTML attributes: always quote the value; keep attribute names fixed, never from data. Encoding does not
  make an event-handler attribute (`onclick`) safe.
- JavaScript: never insert untrusted code, identifiers or expressions; encoded data passed to `eval()` is
  still unsafe. Serve JSON as `application/json`.
- CSS: never interpolate untrusted data into CSS (selectors, properties, declaration blocks); use a fixed
  property with an allow-listed value.
- URLs: percent-encode parameter values only (`encodeURIComponent`); for `href`/`src` URL-encode then
  attribute-encode, and allow only `http` and `https` schemes (block `javascript:`).
- Encoding is not enough inside `<script>`, `<style>`, HTML comments, dynamic tag or attribute names,
  callback names, CSS `url()`, or full event-handler code.
- Safe sinks: `textContent`, `insertAdjacentText()`, `className`, `setAttribute()` with a fixed safe
  name, `value`, `createTextNode()`. Unsafe: `innerHTML` with unsanitized input.
- Rich HTML from users: sanitize with DOMPurify, do not edit the output afterwards, keep the library
  patched.
- Defence in depth only: CSP (useful, easy to misconfigure), Trusted Types, cookie flags, WAFs. None
  replaces encoding at the point of output.
- Anti-patterns: relying on CSP alone; filtering in an HTTP interceptor instead of encoding where data is
  rendered (wrong context, double encoding).

## How to apply it here
| Place in the Studio page | Rule | Current renderer |
|---|---|---|
| Headings, paragraphs, list items | entity-encode 5 characters | `esc()` replaces `& < > " '` |
| Attribute values (ids, `href="#..."`) | quoted, from code or slugified data | ids come from `slug()` (a-z, 0-9, `-`) |
| Colours and CSS | no model data in CSS | palette chosen from a fixed enum |
| Links | only in-page anchors | model gives no URLs; keep it that way |
| Inline `<script>` | no model data inside | keep scripts constant |
- New block kinds: every model field goes through `esc()` or an allow-list; no field may become a tag
  name, attribute name, URL scheme, style or script.
- If a block ever needs an external link from the model, parse it with `new URL()`, allow only `https:`
  (and `http:` if needed), then encode it as an attribute.
- Never add a Markdown or HTML field "for rich text"; if one is required, sanitize with DOMPurify.
- Self-check test cases (the agent's own list): `<script>`, quotes, `"><img onerror=...>`, `javascript:`,
  very long strings; the output must show them as text.
- The preview runs in `sandbox.html` with its own CSP (`connect-src 'none'`); treat that as the extra
  layer, not the defence.

## Limits
- This sheet covers reflected and stored XSS through output encoding; DOM-based XSS has its own OWASP
  sheet.
- It does not cover prompt injection into the model; only what happens after the model answers.
- The table's "current renderer" column comes from reading `render.ts` and `spec.ts` on 2026-11-28.
