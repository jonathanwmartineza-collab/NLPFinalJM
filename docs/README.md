# Docs index

**Executive summary.** BrainyApp2 is a free 36-agent Claude Code team (8 departments, including NLP) with 49 skills and sourced knowledge, plus a static public website on Netlify where people chat with one expert, ask the whole team, and generate accessible web pages. All website AI runs in the visitor’s browser through WebLLM on WebGPU (ADR 0005–0008): no keys, no server, no per-answer cost. See MASTER_PROMPT.md for the audited build prompt.

| Doc | What it covers |
|---|---|
| [01-roles](01-roles.md) | Studio roles and which agent covers each |
| [02-app-types](02-app-types.md) | App taxonomy, stacks, Netlify fit, single-file fit |
| [03-ux-ui-standards](03-ux-ui-standards.md) | WCAG 2.2, heuristics, HIG, Material 3, tokens, Web Vitals |
| [04-one-shot-prompting](04-one-shot-prompting.md) | One-shot patterns and our skeleton |
| [05-claude-code](05-claude-code.md) | Agent/skill formats, loading rules, cloud sessions |
| [06-skills](06-skills.md) | Skills evaluated and verdicts ([lock](skills-lock.md)) |
| [07-netlify](07-netlify.md) | Functions, limits, rate limits, AI Gateway, credits |
| [08-claude-api](08-claude-api.md) | Model IDs, prices, 5.5 rules, streaming, caching |
| [09-reference-teardown](09-reference-teardown.md) | Experts21: keep, improve, don't copy |
| [decisions](decisions.md) · [adr/](adr/) · [threat-model](threat-model.md) | Architecture and safety decisions |
| [expert-roster](expert-roster.md) · [skills-matrix](skills-matrix.md) · [agent-brains](agent-brains.md) | The team (generated) |
| [how-to-talk-to-your-team](how-to-talk-to-your-team.md) | Using the team; running it in Claude Code |
| [MASTER_PROMPT](MASTER_PROMPT.md) | The audited master prompt kit used to build this |

## NLP final (research)
Research for the NLP final exam (NLP Lab page at `/nlp`, NLTK + spaCy on Netlify):
- [Research index and chosen design](research/README.md)
- [Expert roster](expert-roster.md) · [Agent brains](agent-brains.md) — the experts whose profiles form the NLP corpus
