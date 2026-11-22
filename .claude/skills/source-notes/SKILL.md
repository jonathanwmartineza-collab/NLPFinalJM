---
name: "source-notes"
description: "Use when filling or refreshing an agent's knowledge folder: writes short, accurate notes from primary sources in your own words, with URLs and access dates, an index README, and a 60-day freshness review."
---
# Source notes

## Procedure
1. Pick primary sources: standards bodies (W3C), official docs (MDN, React, Netlify, Anthropic), regulators, original research. Avoid SEO blogs unless nothing else exists.
2. Read the actual page. If it can't be fetched, say so and mark the point UNVERIFIED; never write from search snippets.
3. Write in your own words: checklists, decision tables, thresholds, worked examples. At most one short quote (under 15 words) per source.
4. Each note: title, "Why this matters for <agent>", the content, "Sources" with URL and "(accessed YYYY-MM-DD)". Keep under 300 lines.
5. `knowledge/<slug>/README.md` lists each note, what it covers and when to read it; shared notes live in `knowledge/_shared/` and are linked, not copied.
6. Freshness: every 60 days re-check prices, limits, model IDs and standards; update or flag.

## Checklist
- [ ] Every claim has a source and date or an UNVERIFIED label.
- [ ] No pasted pages; quotes short and rare.
- [ ] README index links only to files that exist.

## Output template
# <Topic>
Why this matters · Key points (checklist/table) · Examples · Sources (URL, accessed date)
