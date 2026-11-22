# BrainyApp2

A free, 31-agent Claude Code product studio that plans, designs and builds any kind of application and delivers complete, accessible web UX/UI from one-shot prompts. The same team powers the public website in `web/` (static, on Netlify), where the AI runs in the visitor's browser with WebLLM: no API keys, no server, no cost per answer.

## Every request: prompt → repo → Netlify (read `docs/OPERATING_MANUAL.md`)
Any request to change the project is handled end to end, without asking for go-ahead (the `ship-change` skill has the steps):
1. Sync with `origin/main`. 2. Route the request to its files and owner agent (manual §2). 3. Change only what's needed.
4. Test, then run `./scripts/gates.sh` until it exits 0. 5. One commit, then `git push origin HEAD:main`. Netlify deploys `main` automatically.
6. Run `./scripts/verify-live.sh` (or check the Netlify Deploys page in Chrome if it says UNREACHABLE). 7. Report: change · gates · commit · live result.
- Live: https://brainyapp2.netlify.app (deployed commit at `/version.json`) · Netlify project `brainyapp2` · Deploys: https://app.netlify.com/projects/brainyapp2/deploys
- Ask the owner only when a request is ambiguous **and** expensive to redo, or before Netlify dashboard changes (settings, domain, visibility). Never touch env vars, billing, deletion, passwords or tokens.
- `docs/MASTER_PROMPT.md` is the original build spec: its hard constraints (§3) always apply; don't re-run its phases.
- Verify before you claim. Anything you could not run is marked **NOT RUN**, never "passed". Real-model checks need a WebGPU device.

## How to use the team
- Ask one expert: `@agent-<slug>` (for example `@agent-edge-ai-engineer`).
- Ask the team: `@agent-orchestrator …`, or for big builds: "You (the main session) act as the orchestrator in `.claude/agents/orchestrator.md`; delegate with the Agent tool."
- Long session? Run `/handoff`. Fuzzy requirements? Run `/grill-me`.

## Roster (name · title · model)
Leadership: Nova · Studio Director (Orchestrator) · opus — Owen · Delivery Lead · sonnet
Product: Maya · Product Strategist · opus — Ravi · UX Researcher · sonnet — Lucas · Growth & Analytics · sonnet
Design: Iris · UX Architect · opus — Kai · UI Designer — Lena · Design Systems — Jonah · UX Writer — Noor · Accessibility — Sasha · Motion — Valentina · Brand (all sonnet)
Engineering: Marco · Software Architect · opus — Quinn · AI Engineer · opus — **Ada · Edge AI Engineer · opus** — Sage · Prompt Engineer · opus — Zara · Front-end — Diego · Back-end — Hana · Mobile — Felix · Data — Juno · Creative Tech & Games — **Theo · Template Systems** (sonnet)
Quality: Rhea · Security · opus — Ivy · QA — Arjun · Performance & SEO (sonnet)
Launch: Tess · Netlify DevOps — Milo · Technical Writer (sonnet)
Governance: Morgan · Red Team · opus — Amara · Privacy — Orion · Meta Agent — Elise · Knowledge Curator (sonnet)
Full table: `docs/agent-brains.md` (generated).

## Working agreements
- Think before coding; state assumptions. Simplest thing that works. Change only what the task needs.
- Every change ships with a check. Run `./scripts/gates.sh` before pushing; evidence lands in `reports/gates.md`.
- A push to main that changes site files (`scripts/build-paths.txt`) is a Netlify production deploy (15 credits): batch changes. Docs-only pushes are skipped.
- The site is static: never add API keys, server AI calls or secrets. Model IDs come from the pinned `@mlc-ai/web-llm` package.
- Never link to or describe any private or paid edition of this studio.

## Repository map
- `.claude/agents/` agents (single source of truth; `display:` feeds the website) · `.claude/skills/` skills (`docs/skills-lock.md`)
- `knowledge/` per-agent indexes + `_shared/` sourced notes · `prompts/` one-shot library (`library.json` feeds the site)
- `docs/` master prompt, ADRs, models and licences, decisions · `reports/` gates and readiness
- `web/` Vite + React site · `web/src/ai/` on-device engine, models, prompts, router, Studio schema and renderer (`_generated/` is built, never edited)
- `scripts/` validate-team, check-skills, build-team, gates, stamp-version, should-build (Netlify ignore), verify-live
