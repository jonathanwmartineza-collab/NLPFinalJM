# Content-Security-Policy: directives, fallbacks and values

- Source: Content-Security-Policy (CSP) header - HTTP — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy (accessed 2026-11-28)
- Publisher: Mozilla (MDN Web Docs)
- Licence: CC-BY-SA-2.5 · Copy in repo: link only

Why this matters for security-engineer: this site carries two policies (a meta tag in `web/index.html` and a header
for `/sandbox.html`). Reading them correctly needs the exact fallback rules and keyword meanings.

## Key facts
- Syntax: `Content-Security-Policy: <directive> <value>; <directive> <value>`.
- Fetch directives include `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`,
  `frame-src`, `worker-src`, `media-src`, `object-src`, `child-src`, `manifest-src` and the `-elem`/`-attr` splits.
- Fallbacks: `default-src` backs every other fetch directive; `script-src` backs `script-src-elem/-attr`;
  `style-src` backs `style-src-elem/-attr`; `child-src` backs `frame-src` and `worker-src`.
- Document directives `base-uri`, `sandbox` and navigation directives `form-action`, `frame-ancestors` are not
  fetch directives, so `default-src` does not cover them: set each one you need.
- Values:
  - `'none'` blocks the type; `'self'` is the document's origin.
  - `'unsafe-inline'` allows inline script, handlers and styles; it is ignored when a nonce or hash is present.
  - `'unsafe-eval'` allows `eval()` and `Function()`; MDN warns against it.
  - `'wasm-unsafe-eval'` allows WebAssembly compilation without allowing JavaScript eval.
  - `'strict-dynamic'` passes trust from a nonce- or hash-approved script to scripts it loads, and makes host,
    scheme, `'self'` and `'unsafe-inline'` sources ignored.
  - `'nonce-<value>'` must be new on every response; `'sha256-…'` hashes a script or style body.
- Host sources may use wildcards (`*.example.com`); a path ending in `/` is a prefix match.
- Multiple policies (two headers, a Report-Only header, a meta tag) all apply: each can only restrict further,
  and the strictest wins.
- Workers mostly ignore the page's policy and use their own response's policy, except `blob:` or `data:` workers,
  which inherit the creator's policy.
- Reporting: `report-to` names an endpoint from `Reporting-Endpoints`; `report-uri` is deprecated but MDN
  suggests sending both for now.

## How to apply it here
- App policy (meta tag): `default-src 'self'`; `script-src 'self' 'wasm-unsafe-eval'` plus the jsDelivr CDN
  (Pyodide); `worker-src 'self' blob:`; `connect-src` lists the model and package download hosts;
  `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`.
- `'wasm-unsafe-eval'` is needed for WebAssembly (Pyodide, WebLLM) and is narrower than `'unsafe-eval'`:
  flag any change that swaps one for the other.
- `style-src 'unsafe-inline'` is present; it weakens style injection protection only, not scripts.
- `frame-ancestors` is absent from the meta policy; framing is covered by the `X-Frame-Options: SAMEORIGIN` header.
- Workers created from `blob:` URLs inherit this policy, which is why `connect-src` must list the model hosts.
- Adding a header CSP for `/*` would stack with the meta tag; both apply, so test every page after the change.
- Every new outside host is a review item: name the feature that needs it and the narrowest host pattern.

## Limits
- The page does not state the limits of the meta-tag form; see the OWASP cheat sheet note.
- It does not detail `data:` or `blob:` source handling beyond workers.
- Licence per MDN's attributions and licensing page: prose CC BY-SA 2.5 or later; code samples CC0
  (newer) or MIT (older).
