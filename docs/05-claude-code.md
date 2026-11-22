# 05 · Claude Code: agents, skills and cloud sessions

Summary in our words; see knowledge/_shared/claude-code-agents-skills.md and the sources below.
- **Subagents** live in `.claude/agents/<name>.md`: YAML frontmatter on line 1 (`name`, `description` required; optional `tools`, `disallowedTools`, `model` (sonnet|opus|haiku|fable|ID|inherit), `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort` (low…max), `isolation`, `color` (red, blue, green, yellow, purple, orange, pink, cyan), `initialPrompt`). Unknown keys (our `display:` map) are ignored. Broken YAML = agent silently skipped.
- **Delegation:** descriptions decide when Claude delegates; only agents with the `Agent` tool can delegate; nesting up to 3 levels; about 20 concurrent.
- **Loading:** new agent files are picked up within seconds, but only in agent folders that existed when the session started.
- **Skills** live in `.claude/skills/<name>/SKILL.md`; description + when_to_use truncated at 1,536 characters; keep under 500 lines; `disable-model-invocation: true` = user-only (`/name`) and not preloadable.
- **Cloud sessions:** default network "Trusted" (registries + GitHub). Set Full or Custom for research. VMs include Node 22, Python, Docker and Chrome tooling.

Sources: https://code.claude.com/docs/en/sub-agents , https://code.claude.com/docs/en/skills , https://code.claude.com/docs/en/cloud-environments (accessed 2026-11-21).
