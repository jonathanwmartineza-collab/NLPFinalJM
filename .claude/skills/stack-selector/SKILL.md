---
name: "stack-selector"
description: "Use when choosing technology for a new app of any kind: picks a boring, proven stack by app type, notes whether it fits Netlify, and lists the alternatives and trade-offs."
---
# Stack selector

## Decision table
| App type | Default stack | Netlify fit | Otherwise |
|---|---|---|---|
| Landing page / marketing | Static HTML/CSS or Astro | Yes | — |
| SaaS dashboard | Vite + React + TS; Netlify Functions; Supabase/Neon Postgres | Yes (+ external DB) | Long jobs → background worker elsewhere |
| E-commerce | Shopify/Stripe Checkout + static front end | Yes for front end | Inventory/ERP stays in commerce platform |
| Internal tool / CRUD | React + TS + Postgres (Supabase) + auth | Yes | — |
| PWA / mobile web | Vite + React + Workbox | Yes | — |
| Native mobile | Expo (React Native) | No (EAS builds, app stores) | — |
| AI chat / agent app | React + Netlify Functions (streaming) + Claude API | Yes within function time limits | Long agent runs → background functions or a server |
| Game / creative | Canvas/WebGL (Three.js, PixiJS) | Yes | — |
| Data viz | D3/Observable Plot or Vega-Lite | Yes | Heavy data → precompute at build |
| Browser extension | Manifest V3 + Vite | No (Chrome Web Store) | — |
| API / CLI | Node (Hono) or Python (FastAPI) / Node CLI | Small APIs as Functions | Persistent servers → Fly.io, Render, Railway |
| Desktop | Tauri (or Electron) | No | — |

## Procedure
1. Classify the app; list hard constraints (offline, real-time, long tasks, data residency, budget, team skills).
2. Start from the table; deviate only with a written reason.
3. Check limits: function timeouts, storage, WebSockets, cold starts.
4. Record the decision with adr-writer.

## Checklist
- [ ] Hosting fit stated, with what needs another host.
- [ ] Every non-default choice has a reason.
- [ ] Costs at low and medium scale estimated.

## Output template
**App type** · **Stack** · **Hosting** · **Why** · **Alternatives considered** · **Risks**
