# OWASP CSP Cheat Sheet: how to deploy a policy that holds

- Source: Content Security Policy - OWASP Cheat Sheet Series — https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html (accessed 2026-11-28)
- Publisher: OWASP Foundation (OWASP Cheat Sheet Series)
- Licence: CC-BY-SA-4.0 · Copy in repo: link only

Why this matters for security-engineer: the MDN note says what each directive means; this sheet says which way to
deliver a policy, which patterns resist bypass, and what the meta tag cannot do. That decides whether the app's
meta-tag CSP is enough.

## Key facts
- CSP is defence in depth: it makes bugs harder to exploit, not absent. Do not rely on it alone against XSS.
- On static sites CSP can enforce Subresource Integrity for third-party scripts.
- Delivery:
  - HTTP header: preferred, full feature set; send it on every response, not only the index page.
  - `Content-Security-Policy-Report-Only`: reports without blocking; can run beside an enforced policy.
  - Meta tag: for when headers cannot be set; it does not support `frame-ancestors`, `sandbox` or `report-to`.
  - Never use the obsolete `X-Content-Security-Policy` or `X-WebKit-CSP` headers.
- Strict CSP (current leading practice): nonces or hashes for allowed scripts, optionally `strict-dynamic`,
  with `object-src 'none'` and `base-uri 'none'`. Allowlist policies have known bypasses.
  - Nonces must be unique per response and come from real templating, not tag-rewriting middleware.
  - Hashes break on any change to the script, even whitespace.
- Basic non-strict pattern: same-origin defaults plus `frame-ancestors 'self'` and `form-action 'self'`, for
  apps with no inline code and no outside form posts.
- `frame-ancestors` replaces the obsolete `X-Frame-Options`; it is ignored in a meta tag and does not fall back to
  `default-src`.
- `sandbox` works only as a header; with no value it applies every restriction.
- `plugin-types` and `prefetch-src` were removed from the spec: do not rely on them.
- `'unsafe-inline'` and `'unsafe-eval'` undermine XSS protection; move inline script to files and use
  `addEventListener` instead of inline handlers.
- Reporting: `report-to` with `Reporting-Endpoints` is current; also send deprecated `report-uri` for older browsers.

## How to apply it here
| Finding in this repo | Cheat sheet rule | Suggested fix (for the owning engineer) |
| --- | --- | --- |
| App CSP is a meta tag only | Header preferred; meta lacks `frame-ancestors` | Add a header CSP for `/*` in `netlify.toml` with `frame-ancestors 'self'`, keep the meta tag until tested |
| Framing relies on `X-Frame-Options` | Obsolete, replaced by `frame-ancestors` | Keep XFO for old browsers, add `frame-ancestors` in the header |
| `/sandbox.html` policy uses `sandbox` | Header-only directive | Already a header: keep it there, never move it to a meta tag |
| Sandbox allows `script-src 'unsafe-inline'` | Weakens CSP | Acceptable only because the frame is sandboxed with no same-origin and `connect-src 'none'` |
| No reporting endpoint | Report-Only helps rollout | A static site has nowhere to receive reports; test with a Deploy Preview instead |
| Script CDN for Pyodide | SRI possible on static sites | Pin the version in the URL; consider `integrity` where the loader allows |
- Roll out any CSP change on a Deploy Preview, open every route and the NLP Lab, and read the browser console.
- Review order for a CSP finding: delivery method, then `object-src` and `base-uri`, then script sources,
  then framing, then reporting.
- Severity: a missing `frame-ancestors` on a site with no sign-in and no actions is Low; any added
  `'unsafe-eval'` in the app policy is High until justified.

## Limits
- The sheet points to an outside guide for building strict policies.
- Nonces need real templating per response; this static site renders none, so hashes look like the practical
  strict route here. That is this repo's inference, not the sheet's advice.
- It does not address WebAssembly, workers or on-device model downloads.
