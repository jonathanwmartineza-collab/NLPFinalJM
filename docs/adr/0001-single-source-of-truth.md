# 0001. Agent files are the single source of truth
Status: accepted · Date: 2026-11-21
**Context.** The team exists twice: as Claude Code subagents and as website experts. Two copies drift.
**Options.** (a) Separate roster JSON for the site; (b) generate site data from `.claude/agents/*.md`.
**Decision.** (b). Each agent's frontmatter carries a `display:` map (ignored by Claude Code). `scripts/build-team.mjs` validates the team, then writes `web/public/team.json` (public fields) and `netlify/lib/_generated/agents.ts` (server-only web prompts with condensed knowledge, capped at ~2,000 tokens each).
**Consequences.** Adding an expert = add one file + knowledge; the next build shows it. Generated files are never edited by hand.
