# 04 · One-shot prompting

What reliably produces a complete app or page in one pass (summarised from Anthropic's prompt-engineering guidance, https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview, accessed 2026-11-21):
1. Be clear and direct about the goal, audience and what "done" means.
2. Give a role and context; put long reference material first, the task last.
3. Structure the request with headings or XML-style tags; one instruction per line.
4. Specify the exact output format (one HTML file, first line, no fences).
5. Include constraints that prevent common failures (no external scripts, no lorem ipsum, both themes, states).
6. Ask the model to self-check against a checklist before answering.
7. Iterate with an eval set: same inputs, score outputs, change one thing at a time.

**Skeleton used across the studio:** ROLE · GOAL · AUDIENCE · CONTENT & FEATURES · DESIGN DIRECTION · TECH CONSTRAINTS · ACCESSIBILITY & PERFORMANCE BAR · DELIVERABLE FORMAT · SELF-CHECK BEFORE RETURNING.
The twelve library prompts (prompts/) use it; the website's Studio adds a spec step (one-shot-spec) before the build (one-shot-build).
