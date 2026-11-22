# ADR 0008: Schema-driven One-shot Studio

Date: 2026-11-22 · Status: accepted

## Context
Small models write broken, unsafe HTML, and a full page doesn't fit in 700 tokens.

## Decision
The model fills a small JSON content object (title, tagline, palette, CTA, up to 8 sections across 12 block kinds). A repair step extracts and fixes the JSON, zod validates it with defaults, and if it fails a fallback spec is built from the brief. A pure renderer escapes every string and uses 6 fixed palettes tested for contrast in light and dark. Refine edits the JSON. The Claude Code prompt is assembled without the model.

## Consequences
Pages always render, are accessible and can't run injected script. The Studio is scoped to website pages; apps, dashboards and games get a Claude Code prompt.
