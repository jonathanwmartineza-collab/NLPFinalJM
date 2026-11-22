---
name: "experiment-design"
description: "Use when deciding between product options with data: writes a hypothesis, picks the metric, estimates sample size and duration, defines guardrails and the decision rule for an A/B test or a lightweight experiment."
---
# Experiment design

## Procedure
1. Hypothesis: "Because [evidence], changing [X] for [users] will increase [metric] by [minimum detectable effect]."
2. Primary metric + 1–2 guardrails. Pre-register them.
3. Sample size: use baseline rate and MDE (e.g. baseline 20%, MDE +2 pts, α 0.05, power 0.8 ≈ 6,500 per arm). If traffic is too low, use a qualitative test or a painted-door test instead.
4. Duration: at least one full weekly cycle; no peeking-based stopping.
5. Randomisation unit and exposure logging; check sample-ratio mismatch.
6. Decision rule written before launch: ship / iterate / kill.

## Checklist
- [ ] Hypothesis cites evidence; MDE is realistic.
- [ ] Sample size and duration computed, not guessed.
- [ ] Decision rule fixed in advance.

## Output template
**Hypothesis** · **Metric / guardrails** · **Sample & duration** · **Variants** · **Decision rule** · **Risks**
