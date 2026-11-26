# BrainyApp2

A free, 36-agent Claude Code product studio that plans, designs and builds any kind of application and delivers complete, accessible web UX/UI from one-shot prompts. The same team powers the public website in `web/` (static, on Netlify), where the AI runs in the visitor's browser with WebLLM: no API keys, no server, no cost per answer.

## Every request: prompt → repo → Netlify (read `docs/OPERATING_MANUAL.md`)
Any request to change the project is handled end to end, without asking for go-ahead (the `ship-change` skill has the steps):
1. Sync with `origin/main`. 2. Route the request to its files and owner agent (manual §2). 3. Change only what's needed.
4. Test, then run `./scripts/gates.sh` until it exits 0. 5. One commit, then `git push origin HEAD:main`. Netlify deploys `main` automatically.
6. Run `./scripts/verify-live.sh` (or check the Netlify Deploys page in Chrome if it says UNREACHABLE). 7. Report: change · gates · commit · live result.
- Live (NLP final): https://nlpfinaljm.netlify.app (NLP Lab at `/nlp`) · Netlify project `nlpfinaljm` · Repo: https://github.com/jonathanwmartineza-collab/NLPFinalJM. The original BrainyApp2 (https://brainyapp2.netlify.app) is a separate project; never deploy this repo there.
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
NLP: Petra Novak · Pyodide Engineer · opus — Nora Lindahl · NLTK Expert · sonnet — Santiago Reyes · spaCy Expert · sonnet — Bruno Adeyemi · Python Build Engineer (Netlify) · sonnet — Esther Kwon · NLP Evaluator · haiku
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
- Privacy: the only personal information on the site is the top-bar logo "Jonathan Martinez · AI Practitioner" and the footer line "© 2026 Jonathan Martinez. All rights reserved." No other names, no emails, usernames, code-repository links, credits, "made by"/"built with" lines or audience wording on the site or in the repo (licence attributions required by a licence stay). The e2e privacy test enforces this. **Exception for this exam copy:** the Resources page and the README may also link this project's GitHub repository (https://github.com/jonathanwmartineza-collab/NLPFinalJM) and the course guide (https://claude.ai/artifact/K55JqCeSxXULMmzki6yv73), because the final exam requires both links; no other repository links.
- Commits: author is the owner's git identity (set with `git config user.name` / `user.email`, never written into repo files); no co-author lines.

## NLP final exam (this repo)
This repo is the NLP final project (repository: https://github.com/jonathanwmartineza-collab/NLPFinalJM). It adds an **NLP Lab** page at `/nlp` (`web/src/pages/NlpPage.tsx`) that analyses the app's own texts (expert profiles and `prompts/library.json`); every panel is labelled **NLTK** or **spaCy**.
- **Where NLTK runs:** at build time in CPython 3.13 on Netlify (`nlp/build_nlp.py` → `web/public/nlp/nltk.json`), and live in the visitor's browser through Pyodide v314.0.8 (jsDelivr) in a module Web Worker (`web/src/nlp/nltk.worker.ts` (bundled by Vite, with `web/src/nlp/boot.ts`)) with an `nltk_data` zip; both import the same `nlp/nltk_core.py`. Nothing loads in the browser before the visitor's click.
- **Where spaCy runs:** build time only (`nlp/spacy_core.py`, `en_core_web_sm` 3.8.0, EntityRuler patterns in `nlp/patterns.jsonl`) → `web/public/nlp/spacy.json` (entities, noun-chunk topics, dependency parses).
- **Static site:** no Netlify Functions, no server Python, no secrets. Netlify sets `PYTHON_VERSION` and installs `requirements.txt` (nltk 3.9.4, spaCy 3.8.x, en_core_web_sm 3.8.0 wheel).
- **Tests:** `tests/python/` (pytest) and `tests/unit/` (Vitest); acceptance checks are in the `nlp-eval` skill.
- **Run the Python build locally:**
  ```bash
  python -m venv .venv && . .venv/bin/activate
  pip install -r requirements.txt
  python nlp/build_nlp.py
  python -m pytest tests/python -q
  ```
- **The NLP team** (full table and shared skills: `docs/expert-roster.md`; models and skills: `docs/agent-brains.md`):
  Nora Lindahl `nltk-expert` (sonnet) NLTK module and `nltk.json` · Santiago Reyes `spacy-expert` (sonnet) spaCy module, patterns and `spacy.json` · Petra Novak `pyodide-engineer` (opus) live NLTK box in Pyodide · Bruno Adeyemi `python-build-engineer` (sonnet) Python build on Netlify · Esther Kwon `nlp-evaluator` (haiku) acceptance checks and verdict. Reused: Soraya `orchestrator` (opus) routing · Zuri `meta-agent` (sonnet) agents and skills · Pavel `frontend-engineer` (sonnet) the page · Ulla `qa-engineer` (sonnet) tests and gate · Xavi `devops-engineer` (sonnet) netlify.toml and CSP · Wren `technical-writer` (sonnet) README and Resources · Hugo `knowledge-curator` (sonnet) knowledge notes · Desta `accessibility-specialist` (sonnet) WCAG 2.2.
- Every agent reads `knowledge/<slug>/README.md` first and names the notes it used.

## Repository map
- `.claude/agents/` agents (single source of truth; `display:` feeds the website) · `.claude/skills/` skills (`docs/skills-lock.md`)
- `knowledge/` per-agent indexes + `_shared/` sourced notes · `prompts/` one-shot library (`library.json` feeds the site)
- `docs/` master prompt, ADRs, models and licences, decisions · `reports/` gates and readiness
- `web/` Vite + React site · `web/src/ai/` on-device engine, models, prompts, router, Studio schema and renderer (`_generated/` is built, never edited)
- `nlp/` Python NLP build (`build_nlp.py`, `nltk_core.py`, `spacy_core.py`, `patterns.jsonl`) · `requirements.txt` · `tests/python/` pytest
- `scripts/` validate-team, check-skills, build-team, gates, stamp-version, should-build (Netlify ignore), verify-live
