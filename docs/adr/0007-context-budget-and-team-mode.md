# ADR 0007: 4K context budget and sequential team mode

Date: 2026-11-22 · Status: accepted

## Context
The small models use a 4,096-token context. Full agent web prompts run up to ~8,000 characters plus knowledge notes, which don't fit.

## Decision
- At build time, each agent gets a short prompt: identity, mission, style and up to 5 principles, at most 1,400 characters.
- Enforced limits (`BUDGET` in `web/src/ai/models.ts`): system prompt ≤ 1,800 characters, history ≤ 3,200, input ≤ 2,400, answer ≤ 700 tokens. A unit test checks the worst case is ≤ 85% of the context.
- Team mode: a deterministic keyword router picks 2–3 experts with no model call. They answer one after another (≤ 300 tokens each). Yusra reviews when money, security, legal or launch words appear. Soraya synthesises (≤ 600 tokens).

## Consequences
Answers are instant to route and predictable, but routing quality depends on keywords. The core panel answers when nothing matches.
