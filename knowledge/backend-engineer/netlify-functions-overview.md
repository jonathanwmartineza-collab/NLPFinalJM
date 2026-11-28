# Netlify Functions: what they are and when to use them

- Source: Functions overview — https://docs.netlify.com/build/functions/overview/ (accessed 2026-11-28); supporting page from the same publisher: Get started with functions — https://docs.netlify.com/build/functions/get-started/ (accessed 2026-11-28)
- Publisher: Netlify
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for backend-engineer: Functions are the agent's default way to add server code for a
user's app hosted on Netlify. This repo uses none: CLAUDE.md says the site is static, with no Netlify
Functions, no server Python and no secrets, and netlify.toml has no `[functions]` block.

## Key facts
- A function is a file in the project with server-side code that responds to an event; Netlify runs it
  in an ephemeral runtime and scales it with traffic.
- Functions are version-controlled, built and deployed with the site, so they get Deploy Previews and
  instant rollbacks. Deployed functions are immutable: a production update does not change the
  functions of branch deploys or Deploy Previews.
- Every version is listed in the Functions tab of the Netlify UI, filterable by name, branch or Deploy
  Preview number.
- Web request handler: receives a Web API `Request` and a `Context`, returns a `Response`. A named
  `config` export sets options such as `path` and `method`; with `path: "/hello"` the function is served
  at `https://<domain>/hello`.
- Alternative shape: export an object with a `fetch` method plus `config` (typed with
  `satisfies NetlifyFunction`).
- Platform events: a function can export named handlers (for example `deploySucceeded(event)`) for
  events such as a finished deploy, a form submission or a user signup; identity handlers can change a
  user record or reject a signup.
- Other kinds linked from the overview: Background Functions and Scheduled Functions (details on their
  own pages).
- Netlify's advice for an app's main back end: start with Netlify Server (long-lived, keeps connections
  and state between requests) and use functions beside it for single tasks, scheduled jobs and events.
- From the get-started page: default folder `netlify/functions/`; TypeScript as `.mts` (types from
  `@netlify/functions`), JavaScript as `.mjs`, Go through the Lambda-compatible API.
- Naming: `hello.mts`, `hello/hello.mts` and `hello/index.mts` all create the function `hello`; if
  `items.js` and `items.ts` both exist, the JavaScript file wins.
- Local testing: `@netlify/vite-plugin` emulates functions, edge functions, blobs and env vars inside a
  Vite dev server; otherwise use the Netlify CLI.

## How to apply it here
- Before adding any function, ask: does the feature truly need a server? In this repo the answer has
  been no; AI runs in the browser with WebLLM and NLP output is static JSON from the build.
- If the owner ever asks for one here, it is an architecture change: it breaks the "no server, no secrets"
  rule in CLAUDE.md and needs the software-architect and an ADR first.
- For a user's app: put handlers in `netlify/functions/<name>.mts`, export `config.path`, validate input
  with zod, return Problem Details errors (see problem-details-error-shape.md), read secrets with
  `Netlify.env.get()` on the server only.
- Use Deploy Previews to test a function change; remember production and previews run different
  immutable versions.
- Limits (time, memory, payload size) are not on these two pages: read the Functions API and usage
  pages and cite them with a date before promising a number.

## Limits
- The overview does not state execution time, memory, response size, regions or the default
  `/.netlify/functions/<name>` URL; treat any number for those as UNVERIFIED until read from the
  Functions API or usage pages.
- Netlify docs change often; recheck before quoting.
- Licence: Netlify docs carry the publisher's terms of use; no open licence was found.
