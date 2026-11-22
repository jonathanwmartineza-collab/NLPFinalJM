# Skills lock

Third-party skills installed at project scope (real files, no symlinks) on 2026-11-21, after reading SKILL.md and every bundled script.
Custom skills (35) are written in this repository. Run `npm run check:skills` after any change.

| Skill (folder) | Source repo | Commit | Licence | Verdict | Review notes |
|---|---|---|---|---|---|
| frontend-design | github.com/anthropics/skills (skills/frontend-design) | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | Apache-2.0 (LICENSE.txt) | install | Instructions only; no scripts. |
| webapp-testing | github.com/anthropics/skills (skills/webapp-testing) | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | Apache-2.0 | install | `scripts/with_server.py` starts local dev servers via subprocess for Playwright tests; examples target localhost only. |
| skill-creator | github.com/anthropics/skills (skills/skill-creator) | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | Apache-2.0 | install | Eval scripts call the local `claude` CLI via subprocess; `assets/eval_review.html` loads Google Fonts. No other network calls. |
| web-design-guidelines | github.com/vercel-labs/agent-skills (skills/web-design-guidelines) | `5a37a6329fbad3666c3207392a6a7c0110e92efb` | MIT (declared) | install | Rules bundled in references/; SKILL.md documents an optional manual `curl` to refresh them (maintainers only). |
| vercel-react-best-practices | github.com/vercel-labs/agent-skills (skills/react-best-practices) | `5a37a6329fbad3666c3207392a6a7c0110e92efb` | MIT | install | Rules only; `fetch(` matches are code examples. |
| vercel-composition-patterns | github.com/vercel-labs/agent-skills (skills/composition-patterns) | `5a37a6329fbad3666c3207392a6a7c0110e92efb` | MIT (declared) | install | Rules only. Upstream name differs from the roster's "composition-patterns"; agents reference the upstream name. |
| grill-me | github.com/mattpocock/skills (skills/productivity/grill-me) | `abeeaf95660ba9e8b7c753eb38f441ca707a8823` | MIT | install | User-invoked only (disable-model-invocation), so it is not preloaded; product-strategist suggests `/grill-me`. |
| handoff | github.com/mattpocock/skills (skills/productivity/handoff) | `abeeaf95660ba9e8b7c753eb38f441ca707a8823` | MIT | install | User-invoked only; orchestrator and delivery-lead suggest `/handoff`. |

Later / skipped (see docs/06-skills.md): superpowers (competes with our orchestrator), context-mode, Firecrawl developer index (needs an account), remotion-best-practices, Trail of Bits (our security-review skill covers v1; add selected Trail of Bits skills later), caveman (skip: compresses prose our visitors need).
