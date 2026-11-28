# Claude prompting best practices (living reference)

- Source: Prompting best practices — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices (accessed 2026-11-28); supporting page: Prompt engineering overview — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview (accessed 2026-11-28)
- Publisher: Anthropic
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for prompt-engineer: this is the vendor's own reference for the 5.5 models the studio targets; it settles which habits still help (tags, examples, reasons) and which now break requests (last-turn prefill, thinking budgets).

## Key facts
- Before prompt engineering, the overview asks for three things: clear success criteria, a way to test against them, and a first draft. Some failures (latency, cost) are better fixed by choosing another model than by rewording.
- Clarity test from the page: show the prompt to a colleague with little context; if they would be confused, the model will be too. Treat the model as a capable new hire who lacks your norms.
- Give the reason behind a rule. A bare ban on ellipses works less well than explaining that the text goes to a speech engine that cannot read them.
- Examples: 3–5 for best results, relevant to the real task, diverse (cover edge cases without creating an accidental pattern), each in `<example>` tags inside `<examples>`.
- XML tags separate instructions, context, examples and inputs; use consistent, descriptive names and nest them (for example `<document index="n">` inside `<documents>`).
- A role in the system prompt sets focus and tone; even one sentence helps.
- Long context (20k+ tokens): put the documents at the top and the question at the end; queries at the end improved quality by up to 30% in the vendor's tests. Wrap each document in `<document>` with `<source>` and `<document_content>`, and ask for supporting quotes first.
- Say what to do, not what to avoid: asking for flowing prose paragraphs works better than banning markdown. The prompt's own style pulls the output style: less markdown in the prompt gives less in the answer.
- Prefill on the last assistant turn is not supported on Claude 4.6 and later models and returns a 400; use instructions or structured output instead.
- `budget_tokens` returns a 400 on 4.7 and later; use `thinking: { type: "adaptive" }` with `output_config.effort`.
- Thinking guidance: prefer a general request to think thoroughly over a hand-written step plan; ask for a final self-check against named criteria (except on Opus 5, where it can cause over-verification).
- Tool prompts: an imperative (change this function) makes edits; a question (can you suggest changes) only gets suggestions. Wrap a default in a tag such as `<default_to_action>` or `<do_not_act_before_instructions>`.
- Parallel tool calls happen by default; a `<use_parallel_tool_calls>` block reaches about 100% use. Never let the model guess missing parameters.
- Emphatic wording over-triggers recent models: turn a capitalised CRITICAL/MUST rule into a plain sentence stating when to use the tool, and drop blanket if-in-doubt-use-it lines.
- Agentic guidance: act freely on local, reversible steps; ask before destructive or shared-system ones. Ask for general solutions; tests check correctness and must not be edited to pass.
- Subagents: tell the model to use them only for parallel, isolated or independent work, and to work directly on simple tasks.
- Over-eagerness counter: "Only make changes that are directly requested or clearly necessary." Ask it to delete scratch files at the end.
- The page holds per-model sections (Fable, Mythos, Opus, Sonnet and Haiku, including Opus 5.5, Sonnet 5.5 and Haiku 5.5) covering effort calibration, verbosity and tool triggering.

## How to apply it here
- Studio agent prompts (.claude/agents): keep calm wording, a reason for each rule, and a positive instruction for every "never". Remove stacked MUSTs before an eval run.
- One-shot build specs: put brand, files and reference text first inside tags, and the deliverable and question last.
- Website chat prompts: no prefill and no thinking budget; steer format with an exact output section list and one or two tagged examples.
- Untrusted text (visitor input, retrieved notes) goes in its own tag and is named as data.
- Review checklist before any eval run:
  1. Goal, audience and done-definition stated once.
  2. Each rule has a reason; no contradictions or duplicates.
  3. Examples are 3–5, varied and tagged.
  4. Output format named exactly; nothing relies on prefill.
  5. Emphatic caps removed; tool triggers are specific.
  6. Self-check list at the end, sized to the model.
- Read the per-model section for the target model (Opus 5.5 for agents, Sonnet 5.5 or Haiku 5.5 for site features) before tuning length or effort.

| Old habit | Do now on 5.5 models |
|---|---|
| Prefill `{` to force JSON | Ask for JSON, give a schema, validate in code |
| `budget_tokens` | Adaptive thinking plus `output_config.effort` |
| ALL-CAPS rules | Plain sentence with a reason |
| Step-by-step plan for thinking | A general request to think, then a self-check |

## Limits
- The page is a living reference and changes with each model release; re-read the target model's section before relying on a behaviour.
- The fetched text was condensed; the per-model sections were seen only as a list of topics, not in full: UNVERIFIED for model-specific numbers.
- It does not cover eval design in depth; see the success criteria and evals note.
