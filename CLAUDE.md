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
Leadership: Soraya Lindqvist · Studio Director (Orchestrator) · opus — Benedikt Okafor · Delivery Lead · sonnet
Product: Imani Castellanos · Product Strategist · opus — Priya Halvorsen · UX Researcher · sonnet — Dario Feldmann · Growth & Analytics · sonnet
Design: Ottilie Brandt · UX Architect · opus — Bastien Mwangi · UI Designer — Camila Nordstrom · Design Systems — Anouk Varga · UX Writer — Desta Albrecht · Accessibility — Esme Takahashi · Motion — Farrah Quintero · Brand (all sonnet)
Engineering: Hiroshi Valdez · Software Architect · opus — Ines Abernathy · AI Engineer · opus — **Greta Solberg · Edge AI Engineer · opus** — Jasper Moreau · Prompt Engineer · opus — Pavel Okonjo · Front-end — Kofi Lindgren · Back-end — Mireille Osei · Mobile — Liesl Nakamura · Data — Nikolai Ferreira · Creative Tech & Games — **Odessa Kowalczyk · Template Systems** (sonnet)
Quality: Rosalind Achterberg · Security · opus — Ulla Brennan · QA — Tobias Reinholt · Performance & SEO (sonnet)
Launch: Xavi Montenegro · Netlify DevOps — Wren Castillo · Technical Writer (sonnet)
Governance: Yusra Kaldani · Red Team · opus — Agnes Thorvald · Privacy — Zuri Pellegrino · Meta Agent — Hugo Ferrante · Knowledge Curator (sonnet)
Full table: `docs/agent-brains.md` (generated).

## Working agreements
- Think before coding; state assumptions. Simplest thing that works. Change only what the task needs.
- Every change ships with a check. Run `./scripts/gates.sh` before pushing; evidence lands in `reports/gates.md`.
- A push to main that changes site files (`scripts/build-paths.txt`) is a Netlify production deploy (15 credits): batch changes. Docs-only pushes are skipped.
- The site is static: never add API keys, server AI calls or secrets. Model IDs come from the pinned `@mlc-ai/web-llm` package.
- Never link to or describe any private or paid edition of this studio.
- Privacy: the only personal information on the site is the top-bar logo "Jonathan Martinez · AI Practitioner" and the footer line "© 2026 Jonathan Martinez. All rights reserved." No other names, no emails, usernames, code-repository links, credits, "made by"/"built with" lines or audience wording on the site or in the repo (licence attributions required by a licence stay). The e2e privacy test enforces this.
- Commits: author is the owner's git identity (set with `git config user.name` / `user.email`, never written into repo files); no co-author lines.

## Repository map
- `.claude/agents/` agents (single source of truth; `display:` feeds the website) · `.claude/skills/` skills (`docs/skills-lock.md`)
- `knowledge/` per-agent indexes + `_shared/` sourced notes · `prompts/` one-shot library (`library.json` feeds the site)
- `docs/` master prompt, ADRs, models and licences, decisions · `reports/` gates and readiness
- `web/` Vite + React site · `web/src/ai/` on-device engine, models, prompts, router, Studio schema and renderer (`_generated/` is built, never edited)
- `scripts/` validate-team, check-skills, build-team, gates, stamp-version, should-build (Netlify ignore), verify-live
