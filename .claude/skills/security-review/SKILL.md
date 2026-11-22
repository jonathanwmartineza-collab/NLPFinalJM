---
name: "security-review"
description: "Use when reviewing an app before release or after risky changes: threat model plus OWASP Top 10 and LLM Top 10 checks, secrets scan of the build output, headers/CSP, cookies, rate limits and dependency audit, with evidence."
---
# Security review

## Procedure
1. Threat model (STRIDE-lite): assets (keys, credits, user data), actors (visitor, attacker, owner), entry points (each endpoint, the preview sandbox, uploads), trust boundaries.
2. Secrets: grep the built client bundle for key patterns (`sk-ant-`, `ANTHROPIC`, `APP_PASSWORD`) and env names; check `.gitignore` and git history for leaks.
3. OWASP Top 10: access control on every endpoint; injection (validated inputs, no string-built queries); auth/session (httpOnly, Secure, SameSite, expiry, constant-time compare, login rate limit); security misconfiguration (headers); vulnerable components (`npm audit --omit=dev`); SSRF (no user-supplied URLs fetched server-side).
4. LLM Top 10: prompt injection, insecure output handling, excessive agency, model DoS/cost abuse, sensitive information disclosure.
5. Headers: CSP, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options or frame-ancestors, HSTS.
6. Abuse: rate limits configured and visible in the deploy log; budget and quota enforced server-side.
7. Record each finding with severity (critical/high/medium/low), evidence and fix; re-test fixes.

## Checklist
- [ ] No secret in client bundle (command + output saved).
- [ ] Every endpoint checks auth and validates input.
- [ ] Sandbox isolation tested.
- [ ] High/critical findings fixed or explicitly accepted by the owner.

## Output template
| # | Area | Severity | Finding | Evidence | Fix | Status |
