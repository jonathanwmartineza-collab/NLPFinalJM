---
name: "docs-style"
description: "Use when writing READMEs, guides, resources pages or release notes: a plain-language style and structure that a busy, non-expert reader can follow on the first read."
---
# Docs style

## Procedure
1. Lead with what it is and what the reader can do with it, in two sentences.
2. Structure README: What it is · Quick start (copy-paste commands) · How it works (diagram) · Configuration (env var table) · Deploy · Costs and limits · Troubleshooting · Contributing · Licence.
3. One idea per paragraph; sentences under ~20 words; active voice; second person; sentence-case headings.
4. Steps are numbered, each with one action and how to check it worked.
5. Code blocks are copy-paste ready; never include secrets; use placeholders like `<your-key>` only where the reader must supply a value.
6. Link to sources; date anything that will go stale (prices, limits).
7. Diagrams in Mermaid so they render on GitHub.

## Checklist
- [ ] A newcomer can go from zero to running using only this doc.
- [ ] Every command was actually run (or marked untested).
- [ ] Dated facts have a source.

## Output template
# Title · One-line summary · Quick start · Sections as above
