# 0002. Model access through the SDK with no arguments
Status: accepted · Date: 2026-11-21
**Context.** The owner may use Netlify AI Gateway (no key, billed in Netlify credits; activates after the first production deploy) or an Anthropic key. Gateway credentials are injected as `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` unless the owner sets their own (https://docs.netlify.com/build/ai-gateway/overview/, accessed 2026-11-21).
**Decision.** Create the client lazily as `new Anthropic()`. Models come from `MODEL_OPUS/SONNET/HAIKU` (defaults claude-opus-5-5, claude-sonnet-5-5, claude-haiku-5-5). Follow 5.5 rules: no sampling parameters, no prefill, no thinking budgets; effort via `output_config.effort`; system prompt cached.
**Consequences.** Switching between gateway and own key needs no code change. Streaming through the gateway is not documented: verify after the first deploy (UNVERIFIED until then).
