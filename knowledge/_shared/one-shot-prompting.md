# One-shot prompting
Why this matters: the studio's promise is complete results from one prompt. Details: docs/04-one-shot-prompting.md.

## What makes a one-shot prompt work
- Be explicit about the goal, audience and context; state what "done" means.
- Give a role, then a structured spec (sections, features, states, design direction).
- State constraints and the output format exactly (e.g. one HTML file, first line, no fences).
- Ask for a self-check against a checklist before answering.
- Use clear delimiters (headings or XML-style tags) for long inputs; put long reference material before the question.
- Provide an example of the desired style when tone matters.

## Our skeleton
ROLE · GOAL · AUDIENCE · CONTENT & FEATURES · DESIGN DIRECTION · TECH CONSTRAINTS · ACCESSIBILITY & PERFORMANCE BAR · DELIVERABLE FORMAT · SELF-CHECK BEFORE RETURNING

Sources: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview (accessed 2026-11-21)
