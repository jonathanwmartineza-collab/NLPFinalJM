# Web and LLM application security
Why this matters: AI sites spend money and handle untrusted text and generated code.

## OWASP Top 10 (web) checks we always run
Broken access control · cryptographic failures · injection · insecure design · security misconfiguration (headers, CSP) · vulnerable components (`npm audit`) · authentication failures (session cookies httpOnly/Secure/SameSite, rate-limited login, constant-time compare) · integrity failures · logging/monitoring gaps · SSRF.

## OWASP Top 10 for LLM applications (key items)
- Prompt injection: treat user and retrieved content as data; never let it change rules or tools.
- Insecure output handling: sanitise model output; no raw HTML; sandbox generated code.
- Sensitive information disclosure: no secrets in prompts; never reveal system prompts.
- Excessive agency: least-privilege tools; humans approve side effects.
- Unbounded consumption: budgets, quotas, rate limits, kill switch.

## Our sandbox recipe for generated code
Separate document with `Content-Security-Policy: sandbox allow-scripts …; connect-src 'none'`, embedded with `<iframe sandbox="allow-scripts">` (never allow-same-origin), content via postMessage with `event.source` checks; never open generated code as a blob/data URL on our origin.

Sources: https://owasp.org/www-project-top-ten/ and https://owasp.org/www-project-top-10-for-large-language-model-applications/ (accessed 2026-11-21); https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox (accessed 2026-11-21)
