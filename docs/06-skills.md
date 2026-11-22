# 06 · Skills evaluation

Candidates from https://www.firecrawl.dev/blog/best-claude-code-skills plus Anthropic's official skills (accessed 2026-11-21). Installed versions, commits and licences: skills-lock.md.

| Skill | Purpose | Verdict | Used by | Why |
|---|---|---|---|---|
| frontend-design (anthropics/skills) | Distinctive, non-generic UI | Install | ui-designer, brand-director, frontend-engineer | Core to one-shot UX/UI quality |
| webapp-testing (anthropics/skills) | Playwright testing of local apps | Install | qa-engineer | Evidence for UI behaviour |
| skill-creator (anthropics/skills) | Build and evaluate skills | Install | meta-agent | Team self-improvement |
| web-design-guidelines (vercel-labs) | 100+ UI/UX/a11y rules | Install | accessibility-specialist, red-team-reviewer | Fast, rule-based audits |
| vercel-react-best-practices | React performance rules | Install | frontend-engineer | Performance budgets |
| vercel-composition-patterns | Component API design | Install | frontend-engineer, design-systems-lead | Clean components |
| grill-me (mattpocock) | Interview until the plan is clear | Install (user-invoked) | product-strategist suggests it | Better requirements |
| handoff (mattpocock) | Session summary for a fresh session | Install (user-invoked) | orchestrator, delivery-lead suggest it | Clean step transitions |
| Karpathy guidelines | Behavioural rules against over-engineering | Adopted in CLAUDE.md | everyone | No plugin needed |
| superpowers (obra) | Full dev workflow framework | Later | — | Competes with our orchestrator |
| context-mode | Filter noisy output | Later | — | Only if sessions get noisy |
| Firecrawl developer index | Code research | Later | knowledge-curator | Needs an account |
| Trail of Bits security | Static analysis, audits | Later | security-engineer | v1 uses our security-review skill |
| remotion-best-practices | Programmatic video | Later | — | Only with a video expert |
| caveman | Compress output | Skip | — | Visitors need complete, warm prose |

Install method used: `git clone --depth 1 <repo> /tmp/<name>`, review SKILL.md and scripts, copy the folder into `.claude/skills/` (project scope, real files). The article's `-g` flag installs globally, outside the repository, so we don't use it.
