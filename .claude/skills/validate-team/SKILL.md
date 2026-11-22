---
name: "validate-team"
description: "Use when adding or changing agents or skills: runs npm run validate:team and check:skills, explains each failure, fixes it, and follows the checklist for adding a new expert end to end."
---
# Validate the team

## Procedure
1. Run `npm run validate:team` and `npm run check:skills`. Read every FAIL line.
2. Fix by cause:
   - YAML doesn't parse → quote string values, fix indentation, frontmatter must start on line 1 (Claude Code silently skips broken agent files).
   - name ≠ file name → rename one so they match.
   - invalid model/effort/color/tool → use allowed values (models: opus, sonnet, haiku; effort: low…max; colors: red, blue, green, yellow, purple, orange, pink, cyan; tools: Read, Grep, Glob, Bash, Edit, Write, WebFetch, WebSearch, Skill, Agent).
   - missing or non-preloadable skill → create it, or remove it from `skills:` (skills with `disable-model-invocation: true` can't be preloaded).
   - display keys missing → add displayName, title, department, personality, monogram, mission, examplePrompts (3).
   - Agent tool misuse → only orchestrator and delivery-lead may have it.
   - descriptions too long → shorten to one sentence + "Use when …".
3. Re-run until it passes; `docs/agent-brains.md` regenerates automatically.
4. New expert checklist: agent file → skills → `knowledge/<slug>/README.md` + notes → orchestrator routing table → CLAUDE.md roster → `npm run build` so the website shows it → commit and push.

## Checklist
- [ ] Both checks pass with output saved.
- [ ] New experts appear on the website after a build.

## Output template
| Failure | Cause | Fix | Re-run result |
