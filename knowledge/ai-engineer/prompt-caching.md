# Prompt caching on the Claude API

- Source: Prompt caching — https://platform.claude.com/docs/en/build-with-claude/prompt-caching (accessed 2026-11-28)
- Publisher: Anthropic
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for ai-engineer: every server-side Claude feature in this repo re-sends a long, stable system prompt (agent rules plus condensed knowledge), so caching is the biggest lever on cost and time to first token, and it fails silently when set up wrong.

## Key facts
- Two ways to turn it on. Automatic: one top-level `cache_control: { type: "ephemeral" }` on the Messages request; the breakpoint moves to the last cacheable block as the chat grows. Explicit: put `cache_control` on individual blocks in `tools`, `system` or `messages`. Both can be mixed.
- Prefix order is `tools` → `system` → `messages`. A change at one level invalidates that level and everything after it.
- At most 4 explicit breakpoints. The automatic breakpoint takes one of the 4 slots; with 4 explicit ones already set, automatic caching returns a 400.
- Each breakpoint looks back 20 blocks (the breakpoint counts as one). Runs of consecutive `tool_use` or `tool_result` blocks count as one position each.
- Hits need a byte-identical prefix up to the breakpoint, text and images included.
- TTL: 5 minutes by default (refreshed free on each hit), or `"ttl": "1h"`. The clock starts when the request begins, not when the reply ends. When mixing, 1-hour entries come before 5-minute ones.
- Price multipliers on the base input price: 5-minute write 1.25×, 1-hour write 2×, read 0.1× in general; reads are 0.05× on Opus 5.5 and Sonnet 5.5.
- Per million tokens (base / 5m write / 1h write / read): Opus 5.5 $4 / $5 / $8 / $0.20; Sonnet 5.5 $2 / $2.50 / $4 / $0.10; Haiku 5.5 $0.10 / $0.125 / $0.20 / $0.01 for prompts up to 100k tokens, and $0.50 / $0.625 / $1 / $0.05 above 100k.
- Minimum cacheable prefix is 512 tokens on Opus 5.5, Sonnet 5.5 and Haiku 5.5 (older models need 1,024 to 4,096). Shorter prompts are simply not cached; no error is raised.
- Usage fields: `cache_creation_input_tokens` (written now), `cache_read_input_tokens` (served from cache), `input_tokens` (after the last breakpoint) and `cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`. Total input = read + creation + input. Both cache fields at 0 means nothing was cached.
- Changing tool definitions invalidates everything. Changing `tool_choice` or adding or removing images keeps the tools and system cache but drops the messages cache. Thinking settings and `output_config.effort` changes are model-specific.
- A new entry is usable only once the first response has started, so parallel requests that should share a cache must wait for the first one.
- Pre-warm with `max_tokens: 0` and a breakpoint on the shared prefix; this is rejected with `stream: true`, extended thinking, structured outputs, forced `tool_choice` or inside a Message Batch.
- What can be cached: tools, system blocks, text blocks, images and documents in user turns, tool use and tool result blocks.
- What cannot be cached directly: thinking blocks (they ride along inside earlier assistant turns), sub-content such as citations (cache the whole document block) and empty text blocks.
- Caches are never shared across organizations, and are isolated per workspace on the Claude API.
- Caching does not change the generated output; it only changes price and speed.

## How to apply it here
- Order each request: tools, then the agent's system prompt and condensed notes, then the conversation. Keep timestamps, user names and the incoming question after the breakpoint.
- Start with automatic caching for the multi-turn chat; switch to explicit breakpoints only if tools and system change at different rates.
- Check the stable prefix is at least 512 tokens for 5.5 models; a short agent prompt may not cache at all.
- Keep `tool_choice`, images, thinking config and effort the same between turns of one conversation, and keep JSON key order stable in `tool_use` inputs.
- Use the 1-hour TTL only when the same prefix is reused more often than hourly but less often than every 5 minutes; otherwise the 2× write costs more than it saves.
- Log the usage fields in the Netlify Function on every call and add an eval check: on the second identical request, `cache_read_input_tokens` must be greater than 0.
- Minimal explicit shape for a stable system prompt:

```json
"system": [
  { "type": "text", "text": "<agent rules + condensed notes>",
    "cache_control": { "type": "ephemeral" } }
]
```

- Cost estimate per request: (read tokens × read price) + (write tokens × write price) + (uncached input × base) + (output × output price).

| Symptom | Check first |
|---|---|
| Both cache fields stay 0 | Prefix under 512 tokens, or the breakpoint sits on changing content |
| Writes every call, never reads | Prefix differs byte for byte (date, random id, key order) |
| Cache lost after a tool change | Tool definitions edited; that invalidates all levels |
| Parallel calls all write | Second call sent before the first response began |

## Limits
- The page was read up to about 100,000 of 114,845 characters; later sections (for example cache diagnostics details and some FAQs) were not read.
- Amazon Bedrock has its own minimums and no automatic caching; not relevant unless the project moves off the Claude API.
- Prices and minimums change by model release; re-read the page before quoting a figure in a cost estimate.
