# 08 — Claude API notes for BrainyApp2

What this is: the Claude API facts our Netlify functions rely on — model IDs, prices, effort, thinking,
parameters the 5.5 models reject, streaming, caching, stop reasons, errors and the TypeScript SDK.
Checked on platform.claude.com on 2026-11-21. **UNVERIFIED** = not found in the pages read.

## Sources (all accessed 2026-11-21)

| # | Page | URL |
|---|------|-----|
| C1 | Models overview | https://platform.claude.com/docs/en/about-claude/models/overview |
| C2 | Pricing | https://platform.claude.com/docs/en/about-claude/pricing |
| C3 | Model IDs and versions | https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions |
| C4 | Claude Opus 5.5 overview | https://platform.claude.com/docs/en/models/opus-5-5/overview |
| C5 | Claude Sonnet 5.5 overview | https://platform.claude.com/docs/en/models/sonnet-5-5/overview |
| C6 | Claude Haiku 5.5 overview | https://platform.claude.com/docs/en/models/haiku-5-5/overview |
| C7 | Opus 5.5 migration guide | https://platform.claude.com/docs/en/models/opus-5-5/migration-guide |
| C8 | Sonnet 5.5 migration guide | https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide |
| C9 | Effort | https://platform.claude.com/docs/en/build-with-claude/effort |
| C10 | Thinking (adaptive) | https://platform.claude.com/docs/en/build-with-claude/thinking |
| C11 | Streaming Messages | https://platform.claude.com/docs/en/build-with-claude/streaming |
| C12 | Prompt caching | https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| C13 | Handling stop reasons | https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons |
| C14 | Streaming refusals | https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/handle-streaming-refusals |
| C15 | Rate limits | https://platform.claude.com/docs/en/api/rate-limits |
| C16 | Errors | https://platform.claude.com/docs/en/api/errors |
| C17 | TypeScript SDK | https://platform.claude.com/docs/en/api/sdks/typescript |

Pages were read with a web fetcher (summaries, not raw text). No Haiku 5.5 migration guide was read.

## 1. Models

| Model | API ID | Context | Max output | Thinking | Default effort | Released | Source |
|-------|--------|---------|-----------|----------|----------------|----------|--------|
| Claude Opus 5.5 | `claude-opus-5-5` | 1M | 128K | Adaptive, always on | `medium` | 22 Sep 2026 | C1, C4 |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 1M | 128K | Adaptive (on by default) | `high` | 28 Sep 2026 | C1, C5 |
| Claude Haiku 5.5 | `claude-haiku-5-5` | 1M | 128K | Adaptive (on by default) | `medium` | 7 Oct 2026 | C1, C6 |

- **Aliases:** none listed for 5.5. From the 4.6 generation on, IDs are dateless and the ID *is* the
  snapshot, not a moving alias; weights under an ID never change (C3). So "alias" = the ID above.
- All three: text + images in, text out; knowledge cutoff Jun 2026; retirement not before Sep/Oct 2027 (C4–C6).
- Through Netlify AI Gateway the input is capped at 200k tokens (see docs/07).

## 2. Prices (USD per million tokens)

| Model | Input | 5-min cache write | 1-hour cache write | Cache read | Output | Source |
|-------|-------|-------------------|--------------------|-----------|--------|--------|
| Opus 5.5 | $4 | $5 | $8 | $0.20 | $20 | C2, C4 |
| Sonnet 5.5 | $2 | $2.50 | $4 | $0.10 | $10 | C2, C5 |
| Haiku 5.5 (prompt ≤ 100k) | $0.10 | $0.125 | $0.20 | $0.01 | $0.50 | C2, C6 |
| Haiku 5.5 (prompt > 100k) | $0.50 | $0.625 | $1 | $0.05 | $2.50 | C2, C6 |

- Full 1M context at standard price for Opus/Sonnet; Haiku 5.5 switches tier per request at 100k (C2).
- Batch API: 50% off input and output (C2). Not available through Netlify AI Gateway.
- `inference_geo: "us"` multiplies everything by 1.1 (C2). Fast mode Opus 5.5: $8 / $40 (C2).
- Thinking tokens are billed as **output**, even when hidden (C7, C10).

## 3. Effort (how hard the model works)

Set it on every request as `output_config.effort` (C9):

```ts
await client.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 4000,
  output_config: { effort: "medium" },
  messages: [{ role: "user", content: "..." }],
});
```

- Values: `low`, `medium`, `high`, `xhigh`, `max` — all five listed for Opus 5.5, Sonnet 5.5, Haiku 5.5 (C9).
- `adaptive` is a thinking mode, **not** an effort value (C9).
- Effort covers all output: text, tool calls and thinking. Lower effort may skip thinking (C9).
- Sending the default is the same as leaving it out (C9).

## 4. Thinking on 5.5 models

| Topic | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Source |
|-------|----------|-----------|-----------|--------|
| No `thinking` field | Adaptive | Adaptive | Adaptive | C10 |
| Turn thinking off | Impossible (`disabled` → 400) | Use `{type:"between_tools"}` at effort ≤ high | `disabled` OK at effort ≤ high; 400 at xhigh/max | C7, C8, C9 |
| Thinking text shown | Default `display: "omitted"` (empty thinking, signature kept) | same | same | C7, C10 |

- `max_tokens` is a hard cap on **thinking + answer** (C7, C9, C10). Too small → `stop_reason: "max_tokens"`.
- `display: "summarized"` shows a readable summary; omitting reduces latency, not cost (C10).

## 5. Parameters the 5.5 models reject

The BRIEF listed auditor claims. Result of checking:

| Request setting | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|-----------------|----------|-----------|-----------|
| `temperature`, `top_p`, `top_k` | **CONFIRMED**: "Claude 5 models" return 400 for non-default values (C10); C7 says omit | **CONFIRMED** 400 (C5, C8) | **CONFIRMED** (C10, Claude 5 rule); C6 says omit |
| Assistant prefill (last message from assistant) | **CONFIRMED** 400 (C7) | **CONFIRMED** 400 (C8) | **CONFIRMED** 400 — all 4.6+ models (C10) |
| `thinking: {type:"enabled", budget_tokens}` | **CONFIRMED** 400 (C7, C10) | **CONFIRMED** 400 (C8, C10) | **CONFIRMED** 400 (C10) |
| `thinking: {type:"disabled"}` | **CONFIRMED** 400 (C7, C9) | **CONFIRMED** 400 (C8) | Allowed at effort ≤ high (C9) |
| `tool_choice` `any` / `tool` (forced) | **CONFIRMED** 400, also on token counting (C7, C10) | **CONFIRMED** 400 (C8, C10) | Not on C10's reject list → likely allowed, **UNVERIFIED** |
| `max_tokens` includes thinking | **CONFIRMED** (C7) | **CONFIRMED** (C8) | **CONFIRMED** (C10) |

Also: with API version `2026-10-21` or later, any `temperature`/`top_p`/`top_k` returns 400 on every
model (C10). Allowed `tool_choice` on Opus/Sonnet 5.5: `auto` (default) or `none` (C7, C10).

## 6. Streaming (server-sent events)

Order of events (C11):
1. `message_start` — message with empty `content`.
2. Per content block: `content_block_start` → many `content_block_delta` → `content_block_stop`.
   Delta types: `text_delta`, `input_json_delta` (partial JSON for tools), `thinking_delta`,
   `signature_delta` (just before a thinking block stops).
3. `message_delta` — carries `stop_reason` (null until here) and **cumulative** `usage` (C11, C13).
4. `message_stop`.
- `ping` events can appear anywhere; unknown event types must be ignored safely (C11).
- `event: error` can arrive after HTTP 200, e.g. `overloaded_error` (≈ HTTP 529) (C11, C16).
- Recovering a cut stream on 4.6+ models: send a new **user** message asking Claude to continue from
  the partial text (no prefill). Tool and thinking blocks cannot be partly recovered (C11).
- On refusal while streaming, `stop_details` arrives on `message_delta` (C14).

## 7. Prompt caching

- Simplest: top-level `cache_control: { type: "ephemeral" }` (automatic caching) (C12).
- Or put `cache_control` on a content block; up to **4 breakpoints** (automatic uses one) (C12).
- Cache order is tools → system → messages; changing one level invalidates it and everything after (C12).
- TTL: 5 minutes default, refreshed free on each hit; `ttl: "1h"` costs 2× input to write (C2, C12).
  Netlify AI Gateway supports only the 5-minute cache (docs/07).
- Minimum cacheable prompt: **512 tokens** for Opus 5.5, Sonnet 5.5, Haiku 5.5. Shorter prompts are
  silently not cached (C4–C6, C12).
- Check `usage.cache_creation_input_tokens` and `usage.cache_read_input_tokens`; both 0 = not cached (C12).
- Changing `tool_choice`, images, thinking or `output_config.effort` can break the cache (C12).
- Cache reads do not count toward input-tokens-per-minute limits (C15).

## 8. Stop reasons

| `stop_reason` | Meaning | What our UI does | Source |
|---------------|---------|------------------|--------|
| `end_turn` | Finished normally | Show answer | C13 |
| `max_tokens` | Hit our cap (thinking counts) | Show "answer cut short — continue?" | C13 |
| `stop_sequence` | Hit a stop string | n/a for us | C13 |
| `tool_use` | Wants a tool | n/a unless we add tools | C13 |
| `pause_turn` | Server-tool loop paused | n/a | C13 |
| `refusal` | Declined (HTTP 200, not an error) | Friendly message; reset that turn | C13, C14 |
| `model_context_window_exceeded` | Filled the context window | Treat as truncated | C13 |

Refusal details: `stop_details = { type: "refusal", category, explanation }`; `category` and
`explanation` may be null (C14). Do not resend the same turn unchanged — remove or rephrase it (C14).
Retrying on another model often works; Haiku 5.5 has no server-side fallback (C14). Categories seen for
Sonnet 5.5 include `cyber`, `bio`, `frontier_llm`, `reasoning_extraction`, `general_harms` (C8).

## 9. Errors and rate limits

| HTTP | Type | Our action |
|------|------|-----------|
| 400 | `invalid_request_error` | Bug in our request (e.g. a rejected parameter); log, don't retry |
| 401/403 | auth / permission | Key problem; tell owner |
| 413 | `request_too_large` (Messages max 128 MB) | Trim input |
| 429 | `rate_limit_error` | Wait `retry-after` seconds if present; else back off |
| 500 / 529 | `api_error` / `overloaded_error` | One retry with backoff, then apologise |

(C16.) 429 details (C15): limits are RPM, input TPM and output TPM per model, token-bucket based.
`error.details.error_code` tells a spend cap (`enforced_spend_limit_reached`, no `retry-after`, keeps
failing until access resumes) from a ramp limit (`ramp_limit_exceeded`). Start tier for each 5.5
model: 4,000 RPM / 2M ITPM / 400k OTPM; Start spend cap $500/month (C15). Every response has a
`request-id` header — log it (C16).

## 10. TypeScript SDK (`@anthropic-ai/sdk`)

- `npm install @anthropic-ai/sdk`; Node 20+; browsers disabled by default — we never use it there (C17).
- `new Anthropic()` reads `ANTHROPIC_API_KEY` (C17); `ANTHROPIC_BASE_URL` is set by Netlify AI Gateway (docs/07).
- Retries: 2 by default (connection errors, 408, 409, 429, ≥500); default timeout 10 minutes (C17).
- Errors are `Anthropic.APIError` subclasses, e.g. `RateLimitError` (429), `BadRequestError` (400) (C17).
- Cancel a stream with `stream.controller.abort()` or by breaking the loop (C17).

```ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ maxRetries: 1, timeout: 50_000 }); // stay inside Netlify's 60 s

const stream = client.messages
  .stream({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    output_config: { effort: "medium" },
    system: [{ type: "text", text: agentPromptAndKnowledge, cache_control: { type: "ephemeral" } }],
    messages, // must end with a user message
  })
  .on("text", (t) => send("text", { t }));
const final = await stream.finalMessage(); // final.stop_reason, final.usage
```

If the installed SDK version does not type `output_config`, upgrade the SDK (UNVERIFIED which version
added it).

## Model call rules for our site

- [ ] Use exactly `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, from one config file.
- [ ] Never send `temperature`, `top_p`, `top_k`, `budget_tokens`, `thinking.type: "disabled"` (Opus),
      a trailing assistant message, or forced `tool_choice`. Steer with the system prompt instead.
- [ ] Always set `output_config.effort`: chat `medium`; routing `low`; experts `medium`;
      synthesis `medium`; HTML builds `high`.
- [ ] Size `max_tokens` for thinking + answer: routing 1,000; chat 4,000; expert 3,000;
      synthesis 6,000; HTML build 32,000 (background job only).
- [ ] Stream every user-facing call; forward only text to the browser; send a final `done` event with
      `stop_reason` and `usage`.
- [ ] Routing returns JSON in plain text (no forced tools); parse defensively and fall back to a default
      expert set if parsing fails.
- [ ] Put each agent's system prompt + knowledge first, unchanged between calls, with `cache_control`
      (≥ 512 tokens or it won't cache). Keep timestamps and user data out of the cached part.
- [ ] Handle `refusal`: show `stop_details.explanation` or our own text, drop that turn from history.
- [ ] Handle `max_tokens`: offer "Continue", sent as a new user message.
- [ ] 429/529: one retry max inside a function; then a friendly "busy, try again in a minute".
- [ ] Log `request-id`, model, `usage` and cost per call; never log user content or keys.
- [ ] If using Netlify AI Gateway: no beta headers, input < 200k tokens, 5-minute cache only.

## Cost table (our estimates, list prices from C2)

Assumptions: no caching unless stated; token counts include thinking. Credits = Netlify AI Gateway
credits at 180 per $1 (docs/07). Real thinking use can raise output tokens noticeably.

**A. One agent chat reply — 3,000 in / 600 out**

| Model | Cost | Gateway credits | With 2,500-token cached system prompt (cache hit) |
|-------|------|-----------------|---------------------------------------------|
| Haiku 5.5 | $0.0006 | 0.1 | ≈ $0.0006 |
| Sonnet 5.5 | **$0.012** | 2.2 | $0.0073 (first call, cache write: $0.0133) |
| Opus 5.5 | **$0.024** | 4.3 | $0.0145 (first call: $0.0265) |

**B. Team answer — routing (4,000 in / 300 out) + 4 experts (3,000 in / 800 out each) +
synthesis (6,500 in / 1,200 out) = 22,500 in / 4,700 out**

| Mix | Cost | Credits |
|-----|------|---------|
| All Sonnet | $0.092 | 16.6 |
| Haiku routes, Sonnet experts, Opus synthesis | $0.107 | 19.2 |
| Opus routes + synthesis, Sonnet experts | $0.128 | 23.0 |
| All Opus | $0.184 | 33.1 |

**C. One-shot HTML build — 4,000 in / 12,000 out**

| Model | Cost | Credits | If thinking adds 6,000 output tokens |
|-------|------|---------|--------------------------------------|
| Sonnet 5.5 | **$0.128** | 23.0 | $0.188 |
| Opus 5.5 | **$0.256** | 46.1 | $0.376 |

What it means:
- Opus costs exactly 2× Sonnet per token (C2). Use Opus where judgment matters (synthesis), Sonnet elsewhere.
- Netlify Free has 300 credits/month, and each production deploy uses 15. With no deploys that buys
  about 139 Sonnet chat replies, or 13–18 team answers, through the gateway; every deploy lowers it.
  Use our own API key for real traffic.
- Output speed was not in the pages read. A 12,000-token build needs ≥ 200 tokens/s to finish in
  Netlify's 60 s, so run builds as background functions (docs/07).
