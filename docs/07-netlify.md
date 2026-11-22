# 07 — Netlify platform notes for BrainyApp2

What this is: the Netlify facts our web app depends on (functions, streaming, background jobs, storage,
rate limits, secrets, AI Gateway, credits, `netlify.toml`), checked against docs.netlify.com on
2026-11-21. Every fact has its source. **UNVERIFIED** means the page did not say it or could not be read.

## Sources (all accessed 2026-11-21)

| # | Page | URL |
|---|------|-----|
| N1 | Functions API reference | https://docs.netlify.com/functions/api/ |
| N2 | Functions configuration (limits) | https://docs.netlify.com/build/functions/configuration/ |
| N3 | Background functions | https://docs.netlify.com/build/functions/background-functions/ |
| N4 | Netlify Blobs | https://docs.netlify.com/build/data-and-storage/netlify-blobs/ |
| N5 | Rate limiting | https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/ |
| N6 | Environment variables overview | https://docs.netlify.com/build/environment-variables/overview/ |
| N7 | Env vars in serverless functions | https://docs.netlify.com/build/functions/environment-variables/ |
| N8 | Env vars in edge functions (`Netlify.env`) | https://docs.netlify.com/build/edge-functions/environment-variables/ |
| N9 | Secrets Controller | https://docs.netlify.com/build/environment-variables/secrets-controller/ |
| N10 | Env vars with frameworks | https://docs.netlify.com/build/frameworks/use-environment-variables-with-frameworks/ |
| N11 | AI Gateway overview | https://docs.netlify.com/build/ai-gateway/overview/ |
| N12 | Billing FAQ, credit-based plans | https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/ |
| N13 | How credits work | https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ |
| N14 | File-based configuration (`netlify.toml`) | https://docs.netlify.com/build/configure-builds/file-based-configuration/ |
| N15 | Password protection | https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/ |
| N16 | Netlify AI context file for agents | https://docs.netlify.com/ai-context/netlify-development.mdc |
| V1 | Vite: env variables and modes | https://vite.dev/guide/env-and-mode |

Note: plain `curl` to docs.netlify.com was blocked by this session's proxy; pages were read with a web
fetcher, which returns a summary of the page, not the raw text.

## 1. Functions: the modern format

A function is a file in `netlify/functions/` (default folder, N2) that exports one default handler and an
optional `config` object (N1).

```ts
// netlify/functions/chat.mts
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return new Response("Hello");
};

export const config: Config = { path: "/api/chat", method: "POST" };
```

`config` fields documented on N1:

| Field | What it does |
|-------|--------------|
| `path` | URL path(s) the function answers. Must start with `/`. Cannot be combined with `schedule`. |
| `excludedPath` | Paths to skip even if `path` matches. |
| `method` | Limit to GET/POST/PUT/PATCH/DELETE/OPTIONS (one or a list). |
| `preferStatic` | If `true`, the function runs only when no static file matches. |
| `rateLimit` | `{ action, aggregateBy, to, windowSize, windowLimit }` (see section 5). |
| `background` | `true` = return 202 at once and keep running (section 3). |
| `memory` / `vcpu` | 1024–4096 MB, or 0.5–2 vCPU; pick one (N2). Changing memory: Pro/Enterprise only (N2). |
| `region`, `schedule` | Region code; cron schedule (scheduled functions take no web requests). |

Useful `context` fields (N1): `context.ip`, `context.geo`, `context.requestId`, `context.site`,
`context.cookies`, and `context.waitUntil(promise)` for work after the response (billed until it ends).
Netlify's own guidance for AI agents says to prefer in-code `config` and `.mts` files (N16).

## 2. Limits that shape our design

| Limit | Value | Source |
|-------|-------|--------|
| Normal (buffered) function run time | 60 s, not configurable | N2 |
| Streaming function run time | 60 s | N1, N2 |
| Streamed response size | 20 MB | N1, N2 |
| Buffered request/response payload | 6 MB (binary uploads ≈ 4.5 MB after Base64) | N2 |
| Background function run time | 15 minutes | N2, N3 |
| Background request/response payload | 256 KB | N2 |
| Scheduled function run time | 30 s | N2 |
| Default memory | 1024 MB | N2 |
| Default region | `cmh` (US East, Ohio) for sites made after 4 Oct 2023 | N2 |
| Node runtime | Same as build Node version if it is a valid AWS Lambda runtime; else Node 24 | N2 |

The BRIEF mentions a forum report of a stream cut at 30 s: **UNVERIFIED** (not on N1/N2). Plan for 60 s
and keep each call well under it.

### Streaming
Return a `Response` whose body is a `ReadableStream` (N1). N1 also shows proxying an upstream AI stream
with `content-type: text/event-stream`. Pattern for us (Claude SDK details are in docs/08):

```ts
const encoder = new TextEncoder();
const body = new ReadableStream({
  async start(controller) {
    const send = (event: string, data: unknown) =>
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    // ...forward model text with send("text", {...}); finish with send("done", {...})
    controller.close();
  },
});
return new Response(body, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
```

## 3. Background functions

- **Plans:** available on credit-based Free, Personal and Pro, and on Enterprise (N3). This replaces the
  BRIEF's "historically Pro and above": now **verified for Free**.
- **How:** `export const config = { background: true, path: "/api/build-start" }` (recommended) or the
  older `-background` filename suffix (N3).
- **Behaviour:** the caller gets an empty `202` at once; the return value is thrown away (N1, N3).
- **Retries:** on error, retry after 1 minute, then again 2 minutes later (N3). So jobs must be
  **idempotent** (safe to run twice) — e.g. check a job status in Blobs before starting work.
- **No streaming** from background functions (N3). Netlify's agent guidance says to store results
  somewhere a normal function can read later, such as Netlify Blobs (N16).

## 4. Netlify Blobs (key-value storage)

```ts
import { getStore } from "@netlify/blobs";
const jobs = getStore({ name: "jobs", consistency: "strong" }); // object form, as in N4's example
await jobs.setJSON(jobId, { status: "running", startedAt: Date.now() });
const job = await jobs.get(jobId, { type: "json" }); // null if missing
```

| Topic | Fact | Source |
|-------|------|--------|
| Site-wide vs deploy store | `getStore` survives deploys; `getDeployStore` is tied to one deploy | N4 |
| Consistency | Default eventual: updates/deletes reach all edges within 60 s. `"strong"` = instant, slower reads | N4 |
| Per-read option | `get(key, { consistency: "strong" })` | N4 |
| Methods | `set`, `setJSON`, `get` (`type`: text/json/arrayBuffer/blob/stream), `getWithMetadata`, `getMetadata`, `list` (1,000 per page), `delete`, `deleteAll` | N4 |
| Safe writes | Last write wins; use `onlyIfNew` or `onlyIfMatch: etag` for conditional writes | N4 |
| Limits | Store name ≤ 64 bytes, no `/` or `:`; key ≤ 600 bytes, not starting with `/`; object ≤ 5 GB; metadata ≤ 2 KB | N4 |
| Credentials | On Netlify, do not pass `siteID`/`token` (they replace the automatic ones) | N16 |
| Local dev | Sandboxed store; cannot read production data; CLI is always strong | N4 |
| Plans / price | Not stated on N4 — **UNVERIFIED** (BRIEF says all plans) | — |

N16 also warns: keep non-production (preview) data out of site-wide stores.

## 5. Code-based rate limiting

Set in the function's `config` (not in `netlify.toml` for functions) together with `path` (N5).

```ts
export const config: Config = {
  path: "/api/chat",
  method: "POST",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
```

| Field | Values | Source |
|-------|--------|--------|
| `windowLimit` | Requests allowed per window (no max stated) | N5 |
| `windowSize` | Seconds; **maximum 180** | N5 |
| `aggregateBy` | `["ip"]`, `["ip","domain"]`; `["domain"]` alone is Enterprise-only | N5 |
| `action` | Default `"rate_limit"` = block with HTTP **429**; `"rewrite"` + `to` = send to another path | N5 |

Rules per project: Free/Starter/Personal **2**, Pro **5**, Enterprise with HP Edge 100 (N5).
Blocking can start **up to 10 s late**; requests in that gap still get through (N5). Invalid rules
**do not fail the deploy** — check the "post-processing" lines of the deploy log (N5).

## 6. Environment variables and secrets

| Rule | Source |
|------|--------|
| Functions read vars with `process.env.NAME` (N7's example). Netlify's agent guidance says use `Netlify.env.*` (e.g. `Netlify.env.get("NAME")`) (N16); `Netlify.env.get` / `toObject` are documented for edge functions (N8). Either works in practice; pick one style. | N7, N8, N16 |
| Variables in `netlify.toml` are **not** available to functions. Set secrets in the UI/CLI/API. | N6, N7 |
| A variable must include the **Functions** scope. Choosing scopes is Pro/Enterprise only; by default all scopes apply. | N6, N7 |
| Values are fixed at deploy time; change a value → **redeploy** (a production deploy costs 15 credits). | N7, N13 |
| In Lambda compatibility mode, all env vars together must fit in **4 KB**. | N7 |
| "Contains secret values": write-only, cannot be un-flagged, masked in UI/CLI/API except `dev` context; not allowed with post-processing scope. | N9 |
| Secret scanning checks the build output and **fails the build** if a secret value (over 4 chars) appears. | N9 |
| Anything copied into the browser build is readable by anyone. Vite exposes only `VITE_*` variables to client code and says they must not hold API keys. | N10, V1 |

**Never** name a key `VITE_ANTHROPIC_API_KEY` or similar: it would be baked into the public JavaScript.

## 7. AI Gateway (Claude without your own key)

| Fact | Source |
|------|--------|
| `new Anthropic()` with no arguments works; Netlify injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` in all compute contexts (functions, edge, preview server) | N11 |
| If you set your own `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL`, yours wins; `NETLIFY_AI_GATEWAY_KEY`/`_URL` are always injected too | N11 |
| Credit-based plans only (Free, Personal, Pro); Enterprise: ask account manager | N11 |
| Needs **at least one production deploy** before it activates | N11 |
| Billing: $1 of model usage = **180 credits** | N11, N13 |
| Team-wide limit per minute: Free **90** credits, Personal 450, Pro 1,800, Enterprise 9,000 | N11 |
| Models include `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` | N11 |
| Input limited to **200k tokens** per request (Claude itself allows 1M) | N11 |
| Prompt caching: only the default **5-minute** cache | N11 |
| **No request headers passed through** (so no beta headers), no batch API | N11 |
| Does not store prompts or outputs | N11 |
| Streaming through the gateway: **not documented on N11 — UNVERIFIED.** Netlify's own published agent skill (npm `@netlify/agent-runner-cli`, secondary source) shows streaming examples. Test on the first deploy. | N11 |

### Gateway or our own key?

| Question | AI Gateway | Own `ANTHROPIC_API_KEY` |
|----------|-----------|-------------------------|
| Who bills AI use | Netlify credits (shared with deploys and traffic) | Anthropic account |
| Free plan budget | 300 credits/month total ≈ $1.67 of AI if nothing else used | Netlify credits only for deploys/traffic |
| Out of money | **All team projects pause** | Only AI calls fail (429/400); site stays up |
| Context / caching | 200k input, 5-min cache only | 1M input, 5-min or 1-hour cache |
| Setup | Zero config | Add one secret env var |

**Recommendation:** use our own key (marked secret) for the public demo; the gateway is fine for quick
previews on a paid plan.

## 8. Credits and billing (credit-based plans)

| Meter | Credits | Source |
|-------|---------|--------|
| Production deploy (successful) | **15** each; failed deploys and rollbacks free | N12, N13 |
| Deploy Preview / branch deploy | **0** for the deploy; their web requests are metered | N13 |
| Compute | 10 per GB-hour | N12, N13 |
| Bandwidth | 20 per GB | N12, N13 |
| Web requests | 2 per 10,000 | N12, N13 |
| AI inference (gateway, agent runners) | 180 per $1 | N12, N13 |
| Forms | Free | N12, N13 |

Monthly credits: Free **300** (hard limit, no top-ups), Personal 1,000, Pro from 3,000 (N13).
At zero credits **all web projects on the team pause**, visitors see "Site not available", and new
production deploys are blocked (N12, N13). Auto recharge is off by default and not offered on Free (N13).
The AI usage limit setting covers Agent Runners only, **not** AI Gateway, on non-Enterprise plans (N12).

Free-plan example (our estimate): 10 production deploys = 150 credits, leaving 150 credits ≈ $0.83 of AI.
A 1 GB function running 30 s ≈ 0.008 GB-h ≈ 0.08 credits (assumes billing by memory × wall time).

## 9. Password protection

Site-wide password protection is **not available on credit-based Free and Personal**; on credit-based
Pro you set a shared password under Project visibility (N15). So, like the reference site, we check an
`APP_PASSWORD` secret inside our functions. This protects the API (and our spend), not the static files.

## 10. `netlify.toml` for our site

Syntax from N14; values are ours. `[build]` keys: `base`, `publish`, `command`, `environment`.

```toml
[build]                         # base left unset = repo root (functions + agents live there)
  command = "npm --prefix web ci && npm --prefix web run build"
  publish = "web/dist"

[build.environment]
  NODE_VERSION = "22"          # build Node; functions follow it if it is a valid Lambda runtime (N2)

[functions]
  directory   = "netlify/functions"   # relative to base; keep outside publish (N2)
  node_bundler = "esbuild"
  included_files = [".claude/agents/*.md", "knowledge/**/*.md"]  # * and ! supported (N14)

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]                  # SPA fallback, as shown on N14
  from   = "/*"
  to     = "/index.html"
  status = 200
```

Notes:
- `netlify.toml` headers are global; they cannot be scoped per branch or deploy context (N14).
- Redirects skip existing files unless `force = true` (N14).
- `/api` routing: we use `config.path = "/api/..."` in each function, so no `/api/*` redirect is needed.
  The classic `/api/*` → `/.netlify/functions/:splat` rewrite is **not** on N14 (UNVERIFIED).
- Whether a function's `path` wins over the `/*` SPA fallback is **not stated** in the pages read
  (UNVERIFIED). After the first deploy, `POST /api/chat` must return JSON/SSE, not `index.html`.
- `included_files` paths are relative to the base directory (N14). Whether `**` globs are accepted
  is not shown on N14 (UNVERIFIED); confirm the files are present in the first function bundle.
- The build `command` runs in Bash (N14). Function dependencies (e.g. `@anthropic-ai/sdk`) go in the
  root `package.json`; the `npm --prefix web` layout is our choice, not a Netlify rule.

## Design rules for our site

- [ ] Every Claude call lives in a Netlify Function; the browser never sees a key (N7, N10, V1).
- [ ] `ANTHROPIC_API_KEY` and `APP_PASSWORD` are set in the Netlify UI, scope includes Functions,
      flagged "Contains secret values"; never in `netlify.toml`, never with a `VITE_` prefix (N6, N9, V1).
- [ ] Each function checks `APP_PASSWORD` first and returns 401 before any model call (N15).
- [ ] Interactive calls stream (SSE) and must finish in **< 60 s**; set the SDK timeout ≈ 50 s (N1, N2).
- [ ] One model call per function request. The team flow is driven by the browser: route → experts in
      parallel (one request each) → synthesis. No single request chains the whole team.
- [ ] Anything that may exceed 60 s (big HTML builds) runs as a **background function** (15 min),
      writes progress/results to a strong-consistency Blobs store, and the UI polls a normal function (N3, N4).
- [ ] Background jobs are idempotent (retries after 1 and 2 minutes) (N3).
- [ ] Use both rate-limit rules on the Free plan: `/api/chat` (e.g. 20/min per IP) and
      `/api/build-start` (e.g. 3/180 s per IP); remember the up-to-10 s delay (N5).
- [ ] Batch commits: every production deploy costs 15 credits; prefer Deploy Previews (0 credits) for testing (N13).
- [ ] Watch the credit balance: at zero, **every** project on the team goes offline (N12, N13).
- [ ] Prefer our own API key over AI Gateway on the Free plan; if the gateway is used, keep prompts
      < 200k tokens, 5-min caching only, no beta headers, and deploy to production once first (N11).
- [ ] After first deploy, smoke-test: `/` loads, `/api/chat` streams, wrong password → 401,
      21 fast requests → 429, deploy log shows rate-limit rules as valid.
