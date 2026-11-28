# Delegating to parallel subagents

- Source: How we built our multi-agent research system — https://www.anthropic.com/engineering/multi-agent-research-system (accessed 2026-11-28)
- Publisher: Anthropic (Engineering)
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for orchestrator: it is the publisher's own measured account of a lead agent briefing parallel subagents, with numbers on cost, effort scaling and what a good brief must contain.

## Key facts
- Published 13 June 2025. Pattern: orchestrator-worker. A lead agent plans, saves the plan to memory (context past 200,000 tokens is cut), spawns subagents that search in parallel, then decides whether more work is needed. A separate citation step attaches sources to claims.
- Result: a lead on a larger model with subagents on a smaller model beat the single larger agent by 90.2% on the publisher's internal research eval.
- Token use explained 80% of performance variance on a browsing benchmark; tool calls and model choice took the total to 95%.
- Cost: agents use about 4× the tokens of a chat, multi-agent systems about 15×. Worth it only for high-value tasks.
- Good fit: breadth-first work, heavy parallelism, more information than one context holds, many tools.
- Poor fit: work where every agent needs the same context, many dependencies between agents, and most coding tasks. Agents are not yet good at real-time coordination.
- A brief to each subagent needs four parts: objective, output format, guidance on tools and sources, and clear task boundaries. Vague briefs caused duplicated work.
- Scale effort to the query:
  - Simple fact-finding: 1 agent, 3–10 tool calls.
  - Direct comparison: 2–4 subagents, 10–15 calls each.
  - Complex research: more than 10 subagents with divided responsibilities.
- Parallel dispatch: the lead starts 3–5 subagents at once and each uses 3 or more tools at once; this cut research time by up to 90% on complex queries.
- Other principles from the article:
  - Think like your agents: run them with the exact prompts and tools and watch each step to find failure modes.
  - Start wide, then narrow: short broad queries first, then focused ones.
  - Give each tool a distinct purpose and tell agents which tool fits which job.
  - Use thinking as a planning scratchpad; subagents reflect on tool results before the next query.
  - Prefer heuristics over rigid rules, and add explicit guardrails against runaway behaviour.
  - Prompts should set a collaboration frame: division of labour, approach and effort budget.
- A tool-testing agent that rewrote unclear tool descriptions cut task time by 40%.
- Evaluation: start with about 20 real queries (early changes have large effects); an LLM judge scores 0.0–1.0 plus pass/fail on factual accuracy, citation accuracy, completeness, source quality and tool efficiency; humans catch what automation misses, such as a bias toward low-quality content farms.
- Reliability in production:
  - Errors compound in long runs, so resume from a checkpoint instead of restarting, and let the agent adapt when a tool fails.
  - Trace decision patterns without reading conversation content, to protect privacy.
  - Roll out new versions gradually while old runs finish on the old version.
- The lead waits for each batch to finish; simpler, but it blocks steering mid-batch.
- Subagents should write large outputs to files and return short references, cutting token use and loss in hand-offs.
- For agents that change state, judge the final state rather than every step.

## How to apply it here
- Size before routing: S = one expert, M = 2–6 in one parallel round, L = delivery-lead. Do not spend 15× tokens on a question one expert can answer.
- Every brief carries: the goal and the user's spec text word for word (objective), the return format (≤120-word summary plus file paths), sources and tools to use, and what is outside the lane (boundaries).
- Dispatch all independent briefs in one message; wait only on real dependencies.
- Ask experts to write long work to files under docs/ or reports/ and return paths; open the key files before synthesising.
- Keep the plan in a file when a job may outgrow one context.
- Quick eval for routing changes: about 20 sample requests, judged on right experts chosen, brief completeness and answer quality.
- Avoid multi-agent fan-out for same-file code edits; route those to one engineer.

## Limits
- The system described is a research product, not Claude Code; Claude Code's own limits (3 nesting levels, 20 concurrent subagents) come from its docs.
- Model names and percentages are from the publisher's internal tests in 2025 and may not transfer.
- The article does not give numbers for studio-style mixed tasks (design plus build plus review).
