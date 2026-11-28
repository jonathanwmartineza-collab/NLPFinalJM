# WebLLM API: engine methods, chat options and request fields

- Source: WebLLM API Reference — web-llm 0.2.89 documentation — https://webllm.mlc.ai/docs/user/api_reference.html (accessed 2026-11-28)
- Publisher: MLC (the WebLLM project)
- Licence: Apache-2.0 (declared in the web-llm npm package metadata) · Copy in repo: link only

Why this matters for edge-ai-engineer: the 4,096-token budget, the reset between agents and the device checks all depend on the exact option and method names in this reference for the pinned version.

## Key facts
- Engine methods documented for 0.2.89:
  - `reload(modelId, chatOpts?)`: load one or more models, with optional per-model chat options.
  - `unload()`: unload all models and clear their configs (frees GPU memory).
  - `chat.completions.create(request)`: streamed or non-streamed chat completion.
  - `getMessage(modelId?)`: the current output text.
  - `resetChat(keepStats?, modelId?)`: clear the chat history, optionally keeping usage stats.
  - `getGPUVendor()`: GPU vendor name.
  - `getMaxStorageBufferBindingSize()`: the GPU's largest storage buffer, in bytes.
- Engine config (`MLCEngineConfig`): `appConfig` (model list and cache preference), `initProgressCallback`, and `logitProcessorRegistry` (custom logit processors; MLCEngine only).
- Chat options passed to `reload` (`ChatOptions`):
  - Memory: `context_window_size`, `sliding_window_size`, `attention_sink_size`.
  - Prompt shape: `conv_template`, `conv_config`.
  - Tokenizer: `tokenizer_files`, `tokenizer_info`.
  - Default sampling: `temperature`, `top_p`, `repetition_penalty`, `frequency_penalty`, `presence_penalty`.
- Request fields for `chat.completions.create`:
  - Core: `messages`, `stream`.
  - Length and sampling: `max_tokens`, `stop`, `temperature`, `top_p`.
  - Repetition: `frequency_penalty` and `presence_penalty` (each limited to -2 to 2), `repetition_penalty`, `ignore_eos`.
  - Advanced: `logit_bias`, `n`, `logprobs`, `top_logprobs`.
  - Structure: `response_format` for JSON or a schema.
  - Extras: `enable_thinking`, `enable_latency_breakdown`.
- Unlike the Claude 5.5 API, WebLLM accepts `temperature` and `top_p`; low values suit short, factual advice.

## How to apply it here
- Token budget: set the window explicitly at load time, for example `reload(id, { context_window_size: 4096 })`, so the budget table and the engine agree.
- Budget per request: system prompt + kept history + visitor input + `max_tokens` + margin ≤ 4,096. Enforce it in code before every call; trim history first, then the condensed notes.
- Always send `max_tokens` so a small model cannot run on; pair it with `stop` strings where the format has a clear end.
- When the visitor switches expert, call `resetChat()` so one agent's history never leaks into another agent's prompt.
- When the visitor deletes models or leaves the chat, call `unload()` before removing cache data.
- Use `response_format` for structured output, then still validate the JSON with a schema; never trust it unchecked.
- Device fit: read `getMaxStorageBufferBindingSize()` and `getGPUVendor()` after load and log them with the speed numbers, so slow or failing devices can be grouped.
- Turn on `enable_latency_breakdown` only in a debug build when measuring first-token time.
- Keep `enable_thinking` off for the small chat models unless an eval shows a gain; thinking eats the 4K window.

| Budget slot | Rough size | Enforced by |
|---|---|---|
| System prompt + condensed notes | about 1,500 tokens | Build-time cap on notes |
| History | trimmed to fit | Drop oldest turns first |
| Visitor input | capped in the textbox | Character limit (≈4 chars per token) |
| Answer | `max_tokens` | Request field |
| Margin | about 10% | Code check before the call |

## Limits
- The reference page does not list `interruptGenerate`, `runtimeStatsText`, cache helper functions, `ModelRecord` fields (`vram_required_MB`, `low_resource_required`, `required_features`), `seed` or `tools`. Check the installed package's type definitions before using them: UNVERIFIED here.
- The page does not say which `response_format` variants each model supports; test per model.
- Sizes in the budget table are this project's planning figures, not from the source.
