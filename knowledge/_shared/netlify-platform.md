# Netlify platform for our apps
Why this matters: DevOps, back-end and AI agents design within real limits. Details: docs/07-netlify.md.

## Limits and costs (verified 2026-11-21)
- Streaming functions: 60 s execution limit, 20 MB response (a 30 s cut-off has been reported). Background functions: 15 minutes, respond 202 immediately.
- Code-based rate limiting via `config.rateLimit`; Free/Personal 2 rules per project, Pro 5; invalid rules don't fail deploys; blocking can start up to 10 s late; `aggregateBy: ['ip','domain']` on all plans.
- AI Gateway: no key needed after the first production deploy; your own ANTHROPIC_API_KEY takes precedence; billed in credits ($1 of AI = 180 credits); Free gateway rate limit 90 credits/minute.
- Credit plans: each production deploy uses 15 credits; Free has 300 credits/month; when credits run out, every project on the team pauses until the next cycle.
- Netlify's own site-wide password protection isn't on Free/Personal, so apps implement their own gate.

## Patterns
- Modern functions: `export default async (req, context)` + `export const config = { path: '/api/x' }`.
- Secrets in env vars marked secret, scoped to Functions; never `VITE_`-prefixed.
- Per-path headers in netlify.toml; avoid two CSP headers matching the same path.
- Batch pushes to main to save deploy credits.

Sources: docs/07-netlify.md (citing https://docs.netlify.com, accessed 2026-11-21)
