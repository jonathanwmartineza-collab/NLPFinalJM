# 02 · App types: "any kind of application"

| App type | Recommended stack | Runs on Netlify as-is? | One sandboxed HTML file? | Lead agents |
|---|---|---|---|---|
| Landing page / marketing site | Static HTML/CSS or Astro | Yes | Yes | brand-director, ui-designer, frontend-engineer |
| SaaS dashboard | Vite + React + TS, Netlify Functions, Postgres (Supabase/Neon) | Partly (needs an external database) | Yes (with sample data) | ux-architect, frontend-engineer, backend-engineer |
| E-commerce | Stripe Checkout or Shopify + static front end | Partly (payments/inventory elsewhere) | Yes (demo cart) | ui-designer, backend-engineer |
| Internal tool / CRUD | React + TS + Postgres + auth | Partly (database, auth) | Yes (localStorage demo) | frontend-engineer, data-engineer |
| PWA / mobile web | Vite + React + Workbox | Yes | No (manifest + service worker files) | mobile-engineer |
| Native mobile | Expo (React Native) | No (EAS builds, app stores) | No | mobile-engineer |
| AI chat / agent app | React + Netlify Functions (streaming) + Claude API | Yes, within function time limits | No (needs a server-side key) | ai-engineer, backend-engineer |
| Game / creative coding | Canvas 2D, WebGL (Three.js, PixiJS) | Yes | Yes | creative-technologist |
| Data visualisation | SVG/D3/Observable Plot | Yes | Yes (embedded data) | data-engineer, frontend-engineer |
| Browser extension | Manifest V3 + Vite | No (Chrome Web Store) | No | frontend-engineer |
| API / CLI | Hono/Node or FastAPI; Node CLI | Small APIs as Functions; servers elsewhere | No | backend-engineer, software-architect |
| Desktop | Tauri or Electron | No | No | software-architect |

The website's One-shot Studio handles the "Yes" column of single files; everything else is built by the team in a repository (Step 14 of the master prompt). Netlify limits that shape these choices: docs/07-netlify.md.
