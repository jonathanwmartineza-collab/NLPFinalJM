# Decisions

> **BrainyApp2 note (2026-11-22):** ADRs 0002 (model access) and 0003 (time limits) are superseded by ADR 0005: this edition has no server-side AI. Research files 07 and 08 describe a server-side design that this edition does not use; they are kept for reference.

| # | Decision | Options considered | Choice and reason |
|---|---|---|---|
| 1 | How the site reaches Claude | AI Gateway only · own key only · SDK with no args | `new Anthropic()` with no arguments: works with Netlify AI Gateway (no key) and with the owner's own `ANTHROPIC_API_KEY`, which takes precedence. ADR 0002. |
| 2 | Fitting long generations into Netlify's 60 s streaming limit | Background functions + polling · one long stream · one call per request with continuation | One streamed model call per request; the server stops at 45 s; the browser orchestrates team mode and continues cut-off Studio builds (up to 4 times). Background functions remain the upgrade path. ADR 0003. |
| 3 | Who can spend credits | Public · password · Netlify site protection | Fail closed: AI is off until `APP_PASSWORD` is set (or `PUBLIC_MODE=true`), plus a daily budget, a per-visitor quota and an `AI_ENABLED=false` kill switch. Netlify's own password protection isn't on Free/Personal. ADR 0004. |
| 4 | Running generated code | srcdoc iframe · blob URL in new tab · separate sandbox document | `/sandbox.html` with its own `Content-Security-Policy: sandbox …; connect-src 'none'`, embedded with `sandbox="allow-scripts"` and fed by postMessage. ADR 0004. |
| 5 | Rate limiting on 2 rules (Free plan) | Per function · one endpoint | All model calls go through `/api/model` (rule 1, 40/min per IP) and login through `/api/login` (rule 2, 5/min). |
| 6 | SPA routing vs functions | Catch-all `/*` fallback · explicit routes | Explicit SPA routes in netlify.toml so `/api/*` always reaches functions and unknown paths 404. |
| 7 | Source of truth for the team | Separate JSON · agent frontmatter | Agent files (`display:` map) generate the website data at build time; the build fails if validation fails. ADR 0001. |
| 8 | Default models on the site | All Opus · per-agent · economy | Per-agent models (`COST_MODE=balanced`); Haiku routes team questions; Studio builds use Sonnet unless "Max quality". `COST_MODE=economy` lowers every tier. |
