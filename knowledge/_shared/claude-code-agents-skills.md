# Claude Code agents and skills
Why this matters: the meta agent and every builder work inside Claude Code. Details: docs/05-claude-code.md.

- Subagents: `.claude/agents/<name>.md`, YAML frontmatter on line 1 (name, description required; tools, model, effort, color, skills, …), body = standalone system prompt. Unknown keys are ignored; a file with broken YAML is skipped silently.
- Descriptions drive delegation; keep them short. Subagents never see the conversation.
- Only agents with the `Agent` tool can delegate; nesting up to 3 levels; ~20 concurrent by default.
- New agent files are picked up within seconds, but only in agent folders that existed when the session started; otherwise start a new session.
- Skills: `.claude/skills/<name>/SKILL.md`; description (+ when_to_use) truncated at 1,536 characters; keep SKILL.md under 500 lines; `disable-model-invocation: true` makes a skill user-only and not preloadable.
- Cloud sessions: default network "Trusted" (package registries + GitHub); set Full or Custom for research.
- Invoke: `@agent-<name>`, or let the main session act as the orchestrator and delegate with the Agent tool.

Sources: https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/skills, https://code.claude.com/docs/en/cloud-environments (accessed 2026-11-21)
