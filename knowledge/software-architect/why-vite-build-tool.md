# Why Vite: the build tool choice and its trade-offs

- Source: Why Vite — https://vite.dev/guide/why (accessed 2026-11-28)
- Publisher: Vite (VoidZero and the Vite team)
- Licence: MIT (the Vite project's repository, which holds the docs) · Copy in repo: link only

Why this matters for software-architect: React + Vite + TypeScript is the agent's default stack for web
apps and is what this repo runs (`vite` ^8.3.8). An ADR or stack advice must state why Vite, what it
costs and what is changing; this is the project's own explanation.

## Key facts
- The page documents Vite 8.4.0 (docs navigation, access date).
- The problem it addresses: slow dev server start-up, slow hot updates and long production builds in
  large projects.
- Dev server design:
  - Dependencies (rarely change) are pre-bundled once with fast native tooling.
  - The app's own modules are served on demand as native ES modules; the browser asks only for what the
    current page imports, and Vite transforms each file when requested.
  - Start-up stays nearly instant whatever the app size.
  - HMR over native ESM replaces only the edited module, with no full reload or rebuild.
- Production is still bundled: unbundled ESM costs extra network round trips from nested imports.
- Toolchain change: Vite used esbuild for development and Rollup for production; two tools meant
  inconsistent transforms, two plugin systems and glue code. Rolldown (Rust) now does both and keeps the
  same plugin API; Oxc handles parsing, transforming and minifying.
- The switch shipped first as a technical preview; ecosystem CI and a compatibility layer kept existing
  configs working. vite-ecosystem-ci tests major projects against every Vite change.
- Ecosystem: frameworks such as Nuxt, SvelteKit, Astro, React Router, Analog and SolidStart build on Vite;
  tools such as Vitest and Storybook too.
- Direction: a full bundle mode for the dev server (for very large codebases), the Environment API
  (custom environments such as edge runtimes or service workers), closer Oxc/Rolldown work.

## How to apply it here
| Question | Answer to give |
|---|---|
| Is Vite a safe, boring default? | Yes: wide framework adoption and ecosystem CI on every change (per the page). |
| Does the dev server prove production speed? | No: production is bundled differently; measure `vite build` output. |
| Do old esbuild/Rollup options still apply? | Check the current docs; v8 uses Rolldown and Oxc, older guides differ. |
| SSR or SEO-heavy dynamic pages? | Vite alone is a client build; choose a framework on Vite (for example Astro or React Router) and write an ADR. |
| This repo | Stay on Vite: static output in `web/dist` suits Netlify with no server. |
- Production output is static files in `web/dist` (Vite bundles for production, per the page), which is
  why Netlify can serve the whole site with no server.
- When upgrading Vite majors, record the change as an ADR with the toolchain note above as context, run
  `npm run build`, `npm test` and the e2e suite, and check bundle sizes against the budget.
- Vitest (the repo's unit runner) is built on Vite (per the page); upgrade the two together and rerun
  the unit tests.

## Limits
- The page explains motivation, not configuration; use the Config reference for settings.
- No Rolldown version number or benchmark figures are given on the page.
- Licence: the docs pages show no licence line; MIT is the licence of the Vite project repository that
  holds the docs.
