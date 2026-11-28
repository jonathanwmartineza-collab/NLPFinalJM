# Workflow patterns for agentic systems

- Source: Building effective agents — https://www.anthropic.com/engineering/building-effective-agents (accessed 2026-11-28)
- Publisher: Anthropic (Engineering)
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for orchestrator: the studio director's whole job is choosing between a fixed route, a parallel fan-out and a review loop; this article names those patterns and when each pays for its extra cost.

## Key facts
- Published 19 December 2024; the page notes some tooling it mentions has since changed.
- Two kinds of agentic system: workflows (LLMs and tools follow predefined code paths) and agents (the model directs its own steps and tool use).
- Start with the simplest thing. Agentic systems trade latency and cost for better task results; often one well-built call with retrieval and examples is enough.
- Frameworks help start but hide prompts and responses; begin with direct API calls and understand any framework's internals.
- Building block: the augmented LLM, a model with retrieval, tools and memory behind a clear, documented interface.
- The five workflow patterns:
  1. Prompt chaining: each call works on the previous output, with code "gates" between steps. Use when a task splits cleanly into fixed steps.
  2. Routing: classify the input, then send it to a specialised handler. Use when categories are distinct and better handled apart; also to send easy questions to a smaller model.
  3. Parallelization, two forms: sectioning (independent subtasks at once, for example one call screens input while another answers) and voting (same task several times, then a threshold).
  4. Orchestrator-workers: a central model breaks the task down at run time, delegates to workers and combines results. Differs from parallelization because the subtasks are not known in advance.
  5. Evaluator-optimizer: one model produces, another critiques, in a loop. Use when criteria are clear and feedback measurably improves the result.
- Agents proper: start from a human request, plan and act, get "ground truth" from the environment at each step (tool results, test runs), pause for human input at checkpoints, and stop at a set limit such as a maximum number of iterations.
- Agents cost more and can compound errors: test in a sandbox and add guardrails. They fit open-ended problems where the number of steps cannot be fixed in advance and the model's decisions can be trusted.
- Where agents work well in practice (appendix): tasks that mix conversation with action, have clear success criteria, allow feedback loops and keep meaningful human oversight.
  - Customer support: the agent reads account data and help articles and can act (for example refunds); success is a resolved request.
  - Coding: results can be checked by automated tests and the agent can iterate on test output, but human review stays essential.
- Patterns are building blocks, not prescriptions: measure, iterate, and combine them only when the result clearly improves.
- Moving to production: strip framework layers and build from basic components.
- Three core principles: keep the design simple; make planning steps visible; invest in the agent-computer interface (tool docs and tests).
- Tool design: give the model room to think before it commits; use formats common in ordinary text; avoid line counting and heavy escaping; include examples, edge cases and boundaries versus other tools; change arguments so mistakes are hard to make. In their coding-agent work, requiring absolute file paths removed a class of errors.

## How to apply it here
- Map the routing table to patterns:

| Request shape | Pattern | Orchestrator move |
|---|---|---|
| One discipline, clear question | Single call | Route to one expert |
| Known category (NLTK, spaCy, Pyodide) | Routing | Use the routing table row |
| Independent views (UX, a11y, copy) | Sectioning | Dispatch all briefs in one message |
| Plan not known until explored | Orchestrator-workers | Triage first, then pick 2–6 experts |
| Money, security, legal, release | Evaluator-optimizer | Expert builds, red-team-reviewer judges, one fix loop |
| Fixed multi-step build | Prompt chaining | Hand to delivery-lead with gates per milestone |

- Add complexity only when a simpler route failed on a real case; say which pattern was used in the synthesis.
- Every loop has a stop rule: one red-team re-check, then report BLOCKED.
- Get ground truth before claiming done: files exist, tests ran, URLs answer.
- In briefs, describe tools and files as precisely as a tool definition: absolute paths, expected output format, what is out of lane.
- On the website chat (no Agent tool) the same patterns run as labelled expert views inside one answer.

## Limits
- The article is general guidance, not a Claude Code manual; nesting depth and concurrency limits come from the Claude Code subagents docs.
- Model names in its routing example are older releases; the pattern, not the model choice, is the lesson.
- No numeric thresholds for when to choose agents over workflows are given.
