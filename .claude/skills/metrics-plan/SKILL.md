---
name: "metrics-plan"
description: "Use when a product or feature needs success measurement: defines a north-star metric, input metrics, guardrails, funnel events and a privacy-friendly tracking plan."
---
# Metrics plan

## Procedure
1. North-star metric: the value users get, measured weekly (e.g. "apps generated and downloaded per active user").
2. Input metrics (3–5) the team can move: activation, frequency, depth, retention (D1/D7/D30).
3. Guardrails: errors, latency, cost per user, complaints, accessibility regressions.
4. Funnel: name each event `object_action` (e.g. `build_started`, `build_completed`, `build_downloaded`) with properties; no personal data, no free text.
5. Privacy: prefer cookieless, aggregate analytics; collect the minimum; honour consent where required; document retention.
6. Dashboard: one page, each metric with definition, owner, target, current value.

## Checklist
- [ ] Every metric has a precise definition and data source.
- [ ] Events contain no personal data or user-written text.
- [ ] Guardrails exist for cost and quality.

## Output template
| Metric | Type | Definition | Event(s) | Target | Owner |
