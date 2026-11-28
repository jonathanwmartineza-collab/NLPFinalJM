# CommonMark 0.31.2: the Markdown rules our files rely on

- Source: CommonMark Spec, version 0.31.2 — https://spec.commonmark.org/0.31.2/ (accessed 2026-11-28)
- Supporting page: CommonMark Spec index — https://spec.commonmark.org/ (accessed 2026-11-28)
- Publisher: CommonMark project
- Licence: CC-BY-SA-4.0 · Copy in repo: link only

Why this matters for technical-writer: the README, docs, knowledge notes and the site's chat answers are all
Markdown. Knowing the exact rules prevents broken headings, code blocks that swallow a page, and lists that
restart numbering.

## Key facts
- Latest version: 0.31.2, dated 2024-01-28 (the index lists versions back to 0.5).
- ATX headings (4.2): 1 to 6 `#` then a space or tab; seven `#` is not a heading. Closing `#`s need a space before.
- Setext headings (4.3): a line underlined with `=` (level 1) or `-` (level 2).
- Thematic break (4.1): three or more matching `-`, `_` or `*`.
- Indented code (4.4): four or more spaces; cannot interrupt a paragraph; no language tag.
- Fenced code (4.5): at least three backticks or tildes, not mixed; the closing fence uses the same character and
  is at least as long. The first word of the info string is usually the language. An unclosed fence runs to the
  end of its container.
- Link reference definitions (4.7): label, colon, destination, optional title; may come before or after use;
  the first matching definition wins.
- Block quotes (5.1): `>` plus an optional space.
- List items (5.2): bullets `-`, `+` or `*`; ordered markers are 1 to 9 digits followed by `.` or `)`.
  Content is indented by the marker width plus 1 to 4 spaces.
- Backslash escapes (2.4): any ASCII punctuation can be escaped; a backslash at line end is a hard line break;
  escapes do not work in code blocks, code spans, autolinks or raw HTML.
- Tabs (2.2): where spaces build structure, a tab acts as a stop every 4 characters.
- Tables are not part of the spec; the spec notes that some Markdown extensions added them.

## How to apply it here
- Every code block in a README or note: fenced with three backticks and a language tag (`bash`, `toml`, `ts`,
  `python`), which also meets the accessibility rule for code blocks.
- Never leave a fence unclosed; it turns the rest of the file into code. Check before saving.
- Use `-` for bullets throughout one file, for consistency (the rules on changing markers are in 5.3,
  not read in this round).
- Ordered steps: write `1.` `2.` `3.` in order; markers are digits followed by `.` (or `)`).
- Nested list content: indent to the text of the parent item, not a fixed two spaces.
- Headings start with `#` and a space; use one `#` title per file and do not skip levels.
- Tables in this repo's Markdown rely on an extension: the site renders chat Markdown with `react-markdown` plus
  `remark-gfm`, which supports tables. Plain CommonMark tools will show them as text.
- Avoid raw HTML in notes; the knowledge build keeps only headings, bullets, numbered lines and table rows.
- Separate two block quotes with a blank line only when you mean two quotes.
- Escape a literal `*` or `#` at the start of a line with a backslash, outside code.
- To test an odd case, use the spec's interactive dingus linked from the index page.

## Limits
- The inline sections (emphasis, links, images) were not read in this round; check section 6 before relying on them.
- The section on lists as a whole (5.3: tight versus loose) was not read either.
- The spec is the core only; GitHub-flavoured extensions (tables, task lists) are defined elsewhere.
