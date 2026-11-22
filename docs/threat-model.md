# Threat model (v1.0)

**Assets:** AI credits / API key · owner's Netlify account health (credits pause all sites) · visitors' chats (in their browser) · the site's integrity.
**Actors:** visitor, invited user, anonymous attacker, malicious prompt content, the model itself (untrusted output).

| Threat | Entry point | Control | Verified by |
|---|---|---|---|
| Credit draining / cost abuse | /api/model | Fail closed, password, daily budget, per-visitor quota, rate limit (40/min), kill switch, server-chosen caps | Unit tests (budget, quota, kill switch); rate-limit rule to be confirmed in deploy log |
| Password guessing | /api/login | Rate limit 5/min, constant-time compare | Unit test; live check after deploy |
| Session forgery | cookie | HMAC with key derived from APP_PASSWORD (+ optional SESSION_SECRET), expiry | Unit test (forged cookie rejected) |
| Payload inflation in team mode | synth/review | Signed run token binds slugs; size caps | Unit tests |
| XSS via model output | chat rendering | react-markdown without raw HTML, link allowlist, images as links | Code review; e2e |
| Generated code escaping preview | Studio | /sandbox.html CSP sandbox, iframe sandbox without same-origin, postMessage source checks, no blob/data URLs | E2E (storage blocked, cookie unreadable) |
| Prompt injection | any message | Web rules in every system prompt; no tools on the web; server-side allowlists | Prompt review |
| Secret leakage | client bundle, repo | Secrets only in env; no VITE_ secrets; grep gate | gates.md "Secrets in client bundle" |
| Clickjacking | all pages | X-Frame-Options SAMEORIGIN; sandbox frame-ancestors 'self' | Header check after deploy |
| Dependency vulnerabilities | npm | `npm audit --omit=dev` gate | gates.md |
| Privacy of chats | browser | Stored locally only, "Clear all chats", no content logs | Privacy page; code review |
