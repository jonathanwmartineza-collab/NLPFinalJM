---
name: "netlify-deploy-check"
description: "Use after a Netlify deploy or when one fails: reads the deploy log, verifies build settings, functions, rate-limit rules, environment variables (names only), headers and routing on the live site, and proposes the smallest fix."
---
# Netlify deploy check

## Procedure
1. Read the deploy log top to bottom: install, build command, publish directory, functions bundling, post-processing (headers, redirects, rate-limit rules accepted?). Copy the first real error.
2. Confirm settings come from `netlify.toml` (build command, publish, functions dir, NODE_VERSION).
3. Environment variables: required names exist in the right scopes (Builds vs Functions); secrets marked secret; remember changes apply on the next deploy.
4. Live checks (no model spend): `GET /` returns HTML; `GET /api/config` returns JSON (proves function routing beats the SPA fallback); `GET /api/ping`; security headers present (`curl -sI`); `/sandbox.html` has its own CSP; 404 page works.
5. Rate limit: hit `/api/login` with wrong passwords until 429 (rule 2).
6. Cost awareness: each production deploy uses 15 credits on credit-based plans; batch fixes into one push.

## Checklist
- [ ] Deploy log has no warnings about ignored rules or failed functions.
- [ ] API routes return JSON, not index.html.
- [ ] Headers and CSPs present on the right paths.

## Output template
| Check | Command / place | Expected | Actual | Pass |
**First error:** … · **Fix:** …
