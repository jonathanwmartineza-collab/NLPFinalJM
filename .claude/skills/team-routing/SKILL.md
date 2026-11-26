---
name: "team-routing"
description: "Use when a request is addressed to the whole studio, spans more than one discipline, or it is unclear which experts should answer. Produces a JSON routing plan (2-6 experts, max 4 on the website, each with a stand-alone question), flags stakes that require the red team, and a final synthesis: recommendation, why, who contributed, risks, next steps."
---
# Team Routing

## Purpose
Turn one request into the smallest expert panel that can answer it well, run that panel in parallel,
and merge the answers into one checked reply. The orchestrator (Soraya) owns this skill and never routes
to itself. The formal JSON Schema, the roster cheat sheet and worked examples are in
[reference.md](reference.md).

## Procedure
1. **Classify.** Name the deliverable (answer, plan, spec, build, review) and match the request to
   one or more rows of the routing table below. Several rows can apply; merge them.
2. **Detect stakes.** Tick every stake the request touches (triggers listed under the table). Stakes
   are about consequences, not keywords: "add a Buy button" is money even if nobody says "payment".
3. **Pick the panel.** Start with the lead of each matching row, then add supporters until each
   distinct question has an owner. Limits: 2-6 experts in Claude Code, 2-4 on the website (one
   Netlify streaming function call has a 60 s execution limit, so fewer, faster experts win).
   A single-discipline question still gets 2: the lead plus the closest reviewer.
4. **Add stake owners.** For each stake add its owner if missing: money -> growth-analyst,
   security -> security-engineer, architecture -> software-architect, legal -> privacy-compliance,
   release -> qa-engineer. If any stake is ticked, add `red-team-reviewer` as the LAST entry. The red
   team counts toward the cap; drop the lowest-value supporter to make room, never the red team.
5. **Write stand-alone questions.** Subagents never see the conversation. Each question carries:
   the context in 1-3 sentences, the exact ask, constraints (budget, stack, audience, deadline), the
   output shape and a length cap (website: about 200 words). One distinct angle per expert; never
   send the same question twice.
6. **Plan waves (parallel first).** Everything that does not need another expert's output goes in
   wave 1 and is dispatched in one message (several Agent calls at once). Add a wave only when an
   output is a required input (spec -> build -> QA). Maximum 3 waves. The red team always runs
   last, over the merged draft.
7. **Emit and validate the plan** as JSON (template below). Run the checklist before dispatching.
8. **Synthesize.** Read every answer, resolve conflicts (safety, security and legal findings beat
   preference; evidence beats opinion; say who disagreed and why you chose), then write the
   synthesis in the fixed format. If the red team returns BLOCK, the recommendation cannot be "ship".
9. **Close the loop.** If the deliverable will be shipped or published, run the `release-gate` skill
   before calling it done.

### Routing table
| # | Request type (typical words) | Lead | Add as needed | Usual stakes |
|---|---|---|---|---|
| 1 | One-shot website, landing page, "build me a site" | prompt-engineer (spec) then frontend-engineer (build) | ui-designer, content-designer, accessibility-specialist | release |
| 2 | New product idea, MVP, scope, roadmap | product-strategist | ux-researcher, growth-analyst, software-architect | money |
| 3 | Users, personas, interviews, competitors | ux-researcher | product-strategist, brand-director | - |
| 4 | Metrics, analytics, funnels, A/B tests | growth-analyst | data-engineer, privacy-compliance | legal |
| 5 | Flows, sitemap, wireframes, empty/error states | ux-architect | content-designer, accessibility-specialist | - |
| 6 | Visual design, layout, "make it look better" | ui-designer | brand-director, motion-designer | - |
| 7 | Design system, tokens, theming, dark mode | design-systems-lead | ui-designer, frontend-engineer, accessibility-specialist | - |
| 8 | Copy, microcopy, errors, onboarding text | content-designer | ux-architect, brand-director | - |
| 9 | Accessibility, WCAG, screen readers, keyboard | accessibility-specialist | frontend-engineer, qa-engineer | legal |
| 10 | Animation, transitions, micro-interactions | motion-designer | ui-designer, frontend-engineer, accessibility-specialist | - |
| 11 | Brand, naming, positioning, story | brand-director | product-strategist, content-designer, privacy-compliance (trademarks) | legal |
| 12 | Stack choice, architecture, ADR | software-architect | backend-engineer, data-engineer, devops-engineer | architecture |
| 13 | Front-end build, React/TS components | frontend-engineer | design-systems-lead, accessibility-specialist, qa-engineer | - |
| 14 | API, auth, serverless functions, integrations | backend-engineer | security-engineer, devops-engineer | security |
| 15 | Mobile app, PWA, offline, app stores | mobile-engineer | software-architect, ux-architect, performance-seo-engineer | architecture |
| 16 | AI feature, Claude API, RAG, chat, evals | ai-engineer | prompt-engineer, security-engineer, privacy-compliance | security, money |
| 17 | Database, schema, migrations, data pipelines | data-engineer | backend-engineer, software-architect, privacy-compliance | architecture |
| 18 | Game, canvas, WebGL, generative art | creative-technologist | motion-designer, performance-seo-engineer | - |
| 19 | Prompts, agent system prompts, one-shot prompts | prompt-engineer | ai-engineer, meta-agent | - |
| 20 | Testing, bugs, regressions, Playwright | qa-engineer | frontend-engineer or backend-engineer | - |
| 21 | Security review, secrets, CSP, rate limits | security-engineer | devops-engineer, backend-engineer | security |
| 22 | Speed, Core Web Vitals, Lighthouse, SEO | performance-seo-engineer | frontend-engineer, devops-engineer | - |
| 23 | Deploy, Netlify, build errors, env vars, domains | devops-engineer | backend-engineer, security-engineer | release |
| 24 | README, guides, release notes, help pages | technical-writer | content-designer, the relevant engineer | - |
| 25 | Privacy, consent, cookies, licences, AI disclosure, terms | privacy-compliance | security-engineer, content-designer | legal |
| 26 | Pricing, payments, plans, API or hosting costs | product-strategist | growth-analyst, backend-engineer, devops-engineer | money |
| 27 | Plan, milestones, status, "what's next" | delivery-lead | product-strategist, software-architect | - |
| 28 | Launch readiness, "is it ready to ship?" | delivery-lead | qa-engineer, security-engineer, performance-seo-engineer | release |
| 29 | New agent or skill, change the team | meta-agent | knowledge-curator, prompt-engineer | - |
| 30 | Facts, sources, refresh a knowledge folder | knowledge-curator | the expert who owns the topic | - |
| 31 | Critique this plan or deliverable | red-team-reviewer | the expert who owns the work | release |

**Stake triggers.** money: prices, payments, refunds, subscriptions, credits, paid APIs, budgets.
security: logins, passwords, API keys, user data, uploads, functions open to the internet, prompt
injection. architecture: stack, hosting, database, anything costly to reverse. legal: personal
data, cookies, consent, licences, trademarks, health/finance/children, accessibility law, AI
disclosure. release: deploy, publish, launch, go live, share publicly.

## Checklist
- [ ] Every slug exists in the roster; no `orchestrator`; no duplicate slugs.
- [ ] 2-6 experts (website: 2-4), red team included and counted when any stake is ticked.
- [ ] Every ticked stake has its owner on the panel (or the cap forced a documented trade-off in `reason`).
- [ ] Each question stands alone: context, ask, constraints, output shape, length cap.
- [ ] No two experts got the same question; every part of the request has an owner.
- [ ] Wave 1 holds everything independent; at most 3 waves; red team last.
- [ ] Synthesis names who contributed, records disagreements, and respects a red-team BLOCK.
- [ ] Shipping or publishing goes through `release-gate` before "done".

## Output template
Routing plan (emit exactly this shape; it is parsed by code):
```json
{
  "experts": [
    {"slug": "product-strategist", "question": "Context: a solo baker wants online pre-orders for weekend loaves (about 40 orders/week). Ask: define the MVP scope as 5-7 must-have user stories with one acceptance criterion each. Constraint: no payment processing in v1. Format: numbered list, max 200 words."},
    {"slug": "backend-engineer", "question": "Context: ... Ask: ... Format: ..."},
    {"slug": "red-team-reviewer", "question": "Review the combined pre-order plan for missing requirements and risks around taking money later. Score blockers vs notes. Max 200 words."}
  ],
  "stakes": ["money"],
  "reason": "Scope plus order handling; money is at stake, so the red team reviews last."
}
```

Synthesis (the reply the owner reads):
```markdown
**Recommendation** - <one or two sentences: a decision, not a menu>

**Why**
- <reason tied to an expert's evidence> (<Name>)
- <reason> (<Name>)

**Who contributed**
- <Name> (<slug>) - <one-line contribution>
- Disagreement: <who vs who, on what>; chose <option> because <reason>.

**Risks**
- <risk> - likelihood <low/med/high> - mitigation: <action>
- Red team verdict: <SHIP / SHIP WITH NOTES / BLOCK, or "not required: no stakes">

**Next steps**
1. <action> - owner: <slug> - done when: <check>
2. <action> - owner: <slug> - done when: <check>
```
