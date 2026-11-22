# Claude API (5.5 models) for web features
Why this matters: AI and back-end agents must call the API correctly and within budget. Details and sources: docs/08-claude-api.md.

## Facts (verified 2026-11-21, see docs/08)
- Model IDs: claude-opus-5-5, claude-sonnet-5-5, claude-haiku-5-5.
- List prices per million tokens (input/output): Opus 5.5 $4 / $20; Sonnet 5.5 $2 / $10; Haiku 5.5 $0.10 / $0.50. Cache reads are much cheaper than fresh input.
- Effort is set with `output_config: { effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max' }`.
- 5.5 models reject temperature/top_p/top_k, assistant prefill and manual thinking budgets; forced tool_choice is rejected on Opus and Sonnet. `max_tokens` covers thinking too.
- Handle `stop_reason: "refusal"`, `max_tokens`, and 429/529 (overloaded) gracefully.

## Patterns
- Keep the key server-side; the official SDK `new Anthropic()` with no arguments works with Netlify AI Gateway or your own `ANTHROPIC_API_KEY`.
- Stream with `client.messages.stream(...)`; forward text deltas; ignore thinking deltas in UIs.
- Prompt caching: mark the long, stable system prompt with `cache_control: { type: 'ephemeral' }`.
- JSON from the model: ask for one fenced ```json block, validate with zod, have a fallback.
- Server picks model, effort and max_tokens per mode; the browser never does.

Sources: docs/08-claude-api.md (citing https://docs.claude.com and https://platform.claude.com/docs, accessed 2026-11-21)
