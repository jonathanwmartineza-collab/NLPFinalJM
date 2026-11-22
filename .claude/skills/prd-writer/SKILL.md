---
name: "prd-writer"
description: "Use when an app or feature idea needs a product requirements document: problem, users, jobs-to-be-done, MVP scope, user stories with acceptance criteria, success metrics, risks and out-of-scope."
---
# PRD writer

## Purpose
Give designers and engineers a short, testable definition of what to build and why.

## Procedure
1. Problem: who has it, how often, what it costs them today (time, money, frustration). One paragraph.
2. Users: 1–3 primary segments with their job-to-be-done ("When …, I want to …, so I can …").
3. Goals and success metrics: one north-star metric, 2–3 input metrics, guardrails (e.g. error rate, support tickets).
4. MVP scope: the smallest set of capabilities that delivers the job end to end. Use MoSCoW; "Won't (now)" is mandatory.
5. User stories: "As a …, I want …, so that …" each with Given/When/Then acceptance criteria.
6. Non-functional requirements: accessibility (WCAG 2.2 AA), performance (LCP ≤ 2.5 s, INP ≤ 200 ms), privacy, platforms.
7. Risks, assumptions and open questions, each with an owner and how to de-risk.
8. Release plan: milestones and what each proves.

## Checklist
- [ ] Problem is specific and evidenced, not a solution in disguise.
- [ ] Every story has testable acceptance criteria.
- [ ] Out-of-scope list exists.
- [ ] Metrics are measurable with planned instrumentation.
- [ ] Accessibility and privacy appear as requirements, not afterthoughts.

## Output template
# PRD: <name> · Problem · Users & JTBD · Goals & metrics · Scope (Must/Should/Could/Won't) · Stories & acceptance criteria · Non-functional · Risks & open questions · Milestones
