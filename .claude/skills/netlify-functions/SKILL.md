---
name: "netlify-functions"
description: "Use when writing or reviewing Netlify Functions: modern handler and config, routing with config.path, streaming responses within the 60-second limit, environment variables and secrets, Blobs, AI Gateway and code-based rate limits."
---
# Netlify Functions

## Procedure
1. Handler: `export default async (req: Request, context: Context) => Response` in `netlify/functions/<name>.mts`; route with `export const config: Config = { path: '/api/<name>' }`.
2. Secrets: read with `process.env` / `Netlify.env.get`; mark as secret, scope to Functions; never prefix with `VITE_` (Vite inlines those into the browser bundle).
3. Streaming: return `new Response(readableStream)`; streaming functions are limited to 60 s and 20 MB (docs.netlify.com/functions/api, accessed 2026-11-21; a 30 s cut-off has been reported). Stop your own work at ~45 s and tell the client how to continue; send a heartbeat every 10 s.
4. Long jobs: background functions (`config.background` / `-background` suffix, 15 min) return 202 immediately; store results in Netlify Blobs and poll.
5. Storage: `@netlify/blobs` `getStore({ name, consistency: 'strong' })` for counters and small JSON.
6. AI Gateway: `new Anthropic()` with no arguments picks up injected credentials after the first production deploy; your own `ANTHROPIC_API_KEY` takes precedence.
7. Rate limits: `config.rateLimit = { windowLimit, windowSize (≤180), aggregateBy: ['ip','domain'] }`. Free/Personal plans allow 2 rules per project, Pro 5; invalid rules don't fail the deploy, so check the deploy log.
8. Test handlers directly in Vitest by calling the exported function with a `Request`.

## Checklist
- [ ] Every function has a path, input validation and a clear error shape.
- [ ] No secret reaches the client bundle.
- [ ] Streams end within the time limit and signal completion.
- [ ] Rate-limit rules fit the plan's rule count and appear in the deploy log.

## Output template
File · Path · Method · Limits · Env vars · Tests
