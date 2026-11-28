# Subagent files: fields, loading and limits

- Source: Create custom subagents — https://code.claude.com/docs/en/sub-agents (accessed 2026-11-28)
- Publisher: Anthropic
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for meta-agent: every file in .claude/agents is judged by these rules; a wrong field name is ignored without warning and a broken header makes the agent vanish, so the validator and the house format must match them exactly.

## Key facts
- Only `name` and `description` are required. Field names are camelCase; unknown fields (such as the house `display` map) are ignored silently; `claude --debug` lists them.
- A file is skipped without an error when: it has no `name`, the opening `---` is not line 1, the `name` is invalid, there is a `name` but no `description`, or the YAML does not parse.
- `name`: unique, at most 256 characters, no `:` and must not start with `-`. Identity comes from `name`, not the file path; folders are scanned recursively.
- Supported fields and values:
  - `tools` (allowlist, comma string or YAML list; omitted = inherit) and `disallowedTools` (applied first; a specifier such as `Bash(git push *)` removes the whole tool).
  - `model`: `sonnet`, `opus`, `haiku`, `fable`, a full model ID such as `claude-opus-5-5`, or `inherit`.
  - `effort`: `low`, `medium`, `high`, `xhigh`, `max`.
  - `color`: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`.
  - `permissionMode`: `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`, `manual`.
  - `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory` (`user`, `project`, `local`), `background`, `isolation: worktree`, `omitClaudeMd`, `initialPrompt`, `autoCompactWindow` (100,000–1,000,000).
- Scope priority when names collide: managed settings > `--agents` flag > `.claude/agents/` (project) > `~/.claude/agents/` (user) > plugin `agents/`. Duplicates inside one tree resolve by read order; `/doctor` flags them.
- Model resolution, highest first: per-call `model` → frontmatter `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → the main session's model.
- `skills` preloads full content at startup, first 32 distinct names; skills with `disable-model-invocation: true` cannot be preloaded. Other skills stay reachable through the Skill tool unless `Skill` is not in `tools`.
- `memory` injects the first 200 lines or 25 KB of `MEMORY.md` and turns on Read, Write and Edit.
- A subagent starts with its own prompt, the delegation message, CLAUDE.md (not for Explore or Plan, or with `omitClaudeMd`), git status, preloaded skills and a sibling roster. It does not get the conversation history.
- If `tools` resolves to nothing, the subagent fails to launch.
- Delegation is driven by `description`; phrases such as "use proactively" encourage it.
- Invocation: natural language, an at-mention of the agent, or a whole session with `claude --agent <name>`.
- Limits: combined descriptions over 15,000 tokens trigger a startup warning; nesting is 3 levels below the main session by default; 20 subagents run at once by default; transcripts kept 30 days.
- Reloading: changes in `.claude/agents/` apply within seconds; a restart is needed after creating the first file in a new agents folder or editing under `--add-dir`.
- Plugin subagents ignore `hooks`, `mcpServers` and `permissionMode`; project `mcpServers` and `hooks` load only after the folder is trusted.

## How to apply it here
- Validator rules to keep (scripts/validate-team.mjs): frontmatter on line 1; YAML parses; `name` equals the file name and is under 256 characters with no colon; `description` present.
- Keep house values inside the documented sets: `model` opus|sonnet, `effort` high|medium, `color` from the eight names. A typo here is not an error in Claude Code, it is silently dropped.
- The `display` map is a house extension that Claude Code ignores; the website build reads it, so keep it but never rely on it for behaviour.
- Count `skills` per agent (house roster uses 2–3; hard cap 32) and never list a skill that sets `disable-model-invocation: true`.
- Keep descriptions short: 36 agents share the 15,000-token warning budget. A rough check is total description characters ÷ 4.
- Reviewers stay read-only: omit Edit, Write and Bash from `tools`. Only orchestrator and delivery-lead list `Agent`.
- When adding a new agents folder (for example a plugin), tell the user a session restart is needed.

| Problem report | Likely cause |
|---|---|
| Agent missing from the list | Header not on line 1, YAML error, or no description |
| Field seems ignored | Wrong case or name (fields are camelCase) |
| Skill not preloaded | Over 32 skills, or it has `disable-model-invocation: true` |
| Agent never chosen | Description lacks clear "Use when" triggers |

## Limits
- The page was read up to about 100,000 of 113,622 characters; parts after the resume section were not read.
- Version-tagged features (for example `autoCompactWindow`, `omitClaudeMd`) need a recent Claude Code; check the installed version before using them.
- The house format (section order, 70–140 body lines, quoted strings) is the studio's own rule, not a Claude Code requirement.
