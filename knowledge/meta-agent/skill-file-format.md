# Skill files: fields, invocation and loading

- Source: Extend Claude with skills — https://code.claude.com/docs/en/skills (accessed 2026-11-28)
- Publisher: Anthropic
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for meta-agent: the studio ships its craft as .claude/skills/<name>/SKILL.md files; whether a skill triggers, can be preloaded into an agent, or runs a script safely depends on these exact fields.

## Key facts
- A skill is a folder with `SKILL.md`; frontmatter must start on line 1 between `---` markers. If the YAML does not parse, the skill loads with no fields set. Unknown fields are ignored.
- Locations: enterprise (managed), personal `~/.claude/skills/`, project `.claude/skills/`, nested `<subdir>/.claude/skills/`, `--add-dir` folders, plugins (named `plugin:skill`). Enterprise beats personal, personal beats project.
- Key fields:
  - `name` (defaults to the folder name) and `description` (what it does and when; the key use case first).
  - `when_to_use`: extra trigger phrases, appended to the description.
  - `disable-model-invocation: true`: only the user can run it; it also blocks preloading into subagents and its description leaves the context.
  - `user-invocable: false`: hidden from the slash menu; only the model can run it.
  - `allowed-tools`: tools usable without a prompt during the invoking turn only; it does not restrict other tools. `disallowed-tools` removes tools while active.
  - `model`, `effort` (`low`…`max`), `context: fork` with `agent` (Explore, Plan, general-purpose or a custom agent), `background`, `hooks`, `paths` (globs that limit auto-loading), `shell` (`bash` or `powershell`), `arguments`, `argument-hint`, `metadata`.
- `description` plus `when_to_use` is cut at 1,536 characters in the listing.
- Keep `SKILL.md` under 500 lines; move reference material into sibling files linked from it. Scripts in the folder are run, not loaded.
- Progressive loading: descriptions stay in context; the full body loads only when invoked. After auto-compaction the latest invocation of each skill is re-attached, first 5,000 tokens each, 25,000 tokens in total.
- Substitutions: `$ARGUMENTS`, `$0`/`$ARGUMENTS[N]` (shell-style quoting), named `$name`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`. Escape a literal dollar as `\$`.
- Dynamic context: a line with !`command` runs before the skill reaches the model and is replaced by its output. 2-minute timeout; a failing command aborts the whole invocation (append `|| true` where non-zero exits are normal); commands are checked against permission rules. `disableSkillShellExecution: true` turns this off.
- `context: fork` runs the skill as a subagent that cannot see the conversation, in the background by default; do not fork pure guideline skills with no task.
- Access control: deny `Skill` to turn all skills off; `Skill(name)` matches exactly, `Skill(name *)` matches with any arguments; `skillOverrides` sets `on`, `name-only`, `user-invocable-only` or `off`.
- Live reload covers edits in existing skill folders; a new top-level skills folder needs `/reload-skills`.
- Outside Claude Code (Skills API, claude.ai uploads) only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` are allowed; any other key is a hard error.
- Testing: compare fresh sessions with and without the skill (set it `off` with `skillOverrides`); `/skill-doctor` reports each skill's context cost and use.

## How to apply it here
- House skill checklist (npm run check:skills should enforce):
  1. Folder name equals `name`; header on line 1.
  2. Description starts "Use when …", key trigger first, and with `when_to_use` stays under 1,536 characters.
  3. Body 50–180 lines (house rule), never over 500; long tables go to a sibling file.
  4. Side-effect skills (deploy, publish, send) set `disable-model-invocation: true` and are never listed in an agent's `skills`.
  5. Any !`command` line is reviewed by security-engineer and pre-approved through `allowed-tools` scoped to `${CLAUDE_SKILL_DIR}`.
- If a skill will also be uploaded to the Skills API, strip Claude Code-only fields first or the upload fails.
- Pick the right invocation mode:

| Need | Setting |
|---|---|
| Model may pick it, user may run it | default |
| Only the user may run it (risky action) | `disable-model-invocation: true` |
| Background knowledge the model loads itself | `user-invocable: false` |
| Heavy task in its own context | `context: fork` + `agent` |
| Only for some files (for example web/nlp/**) | `paths` |

- When a skill "does not trigger": check the description wording and length cut, then `skillOverrides`, then permission rules.

## Limits
- The page was read up to about 100,000 of 114,477 characters; the troubleshooting sections were not read.
- Bundled skills and version-gated fields change between Claude Code releases; confirm with the installed version.
- Third-party skill vetting (source, licence, lock file) is the studio's rule, not covered on this page.
