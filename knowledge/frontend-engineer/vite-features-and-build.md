# Vite features the front end relies on

- Source: Features (Vite guide) — https://vite.dev/guide/features (accessed 2026-11-28)
- Publisher: Vite (VoidZero and the Vite team)
- Licence: MIT (the Vite project's repository, which holds the docs) · Copy in repo: link only

Why this matters for frontend-engineer: the site is a React + TypeScript app on Vite (`vite` ^8.3.8,
`web/vite.config.ts`), with two module workers (WebLLM and Pyodide) and a strict CSP. These are the
rules Vite itself states for TypeScript, CSS, assets, workers and production builds.

## Key facts
- The page documents Vite 8.4.0 (version shown in the docs navigation on the access date).
- TypeScript: Vite only transpiles `.ts`; it never type-checks. Run `tsc --noEmit` alongside the
  production build; in development use `tsc --noEmit --watch` or vite-plugin-checker.
- Set `"isolatedModules": true`: the Oxc transformer cannot handle `const enum` or implicit type-only
  imports. Use `import type` for type-only imports.
- Vite ignores tsconfig `target`; dev uses `oxc.target` (default `esnext`), builds use `build.target`.
- `useDefineForClassFields` defaults to `true` for target ES2022 or newer.
- Client types: add `"vite/client"` to `compilerOptions.types` or a `/// <reference types="vite/client" />`
  line in a `.d.ts`; this types asset imports, `import.meta.env` and `import.meta.hot`.
- JSX/TSX work out of the box (transpiled by Oxc); React Fast Refresh comes from the official plugin.
- CSS: imported `.css` is injected with HMR; `@import` is inlined and `url()` rebased; `*.module.css` gives a
  CSS Modules object; `?inline` returns the CSS string without injecting it. Lightning CSS minifies CSS in
  production by default. Sass, Less and Stylus must be installed separately.
- Import suffixes: `?url` (asset URL), `?raw` (file as string), `?worker` / `?sharedworker`
  (constructors), `?worker&inline`, `?worker&url`, `?init` (WebAssembly).
- JSON: import whole, or import root fields as named exports so unused fields tree-shake.
- `import.meta.glob`: lazy by default, `{ eager: true }` to import directly; arguments must be literals.
- Dynamic `import()` with variables: only one directory level deep, path starts `./` or `../`, ends with an
  extension.
- Workers: the recommended form is `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`
  with the `new URL()` written inside the constructor and static options.
- CSP: allow `data:` in `img-src` and `font-src`, or set `build.assetsInlineLimit: 0`; never allow `data:`
  in `script-src`. `html.cspNonce` adds a per-request nonce (needs a server to replace it).
- Build, automatic: CSS split per async chunk (`build.cssCodeSplit`), `<link rel="modulepreload">` for
  entry chunks and their direct imports, and shared chunks of async imports fetched in parallel.

## How to apply it here
- `npm run typecheck` (tsc --noEmit) is the type gate; a green `vite build` proves nothing about types.
- The repo tsconfig has no `isolatedModules`; add it if a `const enum` or a type-only re-export ever
  appears, or the build may break silently.
- Workers in `web/src/ai/engine.ts` and `web/src/nlp/client.ts` already use the recommended
  `new Worker(new URL(...), { type: 'module' })` shape; keep it literal so Vite bundles the worker.
- The CSP meta tag in `web/index.html` allows `img-src 'self' data:` and `font-src 'self'`. If a font is
  ever inlined as `data:`, either add `data:` to `font-src` or set `assetsInlineLimit: 0`.
- `html.cspNonce` does not fit: the site is static on Netlify with no per-request server to swap nonces.
- Heavy optional code (the NLP live box, the Studio renderer) goes behind `React.lazy` / dynamic
  `import()` so Vite splits it and the first load stays inside the 170 KB gzipped JS budget.
- Import large JSON (`nlp/*.json`) with `fetch` from `public/` at runtime, not as a module, so it never
  lands in the JS bundle.
- `build.target: 'es2022'` in `web/vite.config.ts` is what controls output syntax, not tsconfig.

## Limits
- The page covers features, not every config option; check the Config reference before changing
  `build.*` or `server.*` settings.
- Version-sensitive: older guides (v2 to v4) describe esbuild where v8 uses Rolldown and Oxc; use only the
  current guide.
- Licence: the docs pages show no licence line; MIT is the licence of the Vite project repository that
  holds the docs folder (confirmed on the repository page).
