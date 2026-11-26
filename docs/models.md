# Models and licences

Checked 2026-11-22 against `@mlc-ai/web-llm` 0.2.89 (`prebuiltAppConfig.model_list`). `tests/unit/models.test.ts` fails if an ID disappears.

| Tier | f16 build (shader-f16) | f32 build (fallback) | Est. VRAM | Licence | Conditions |
|---|---|---|---|---|---|
| Lite | Llama-3.2-1B-Instruct-q4f16_1-MLC | Llama-3.2-1B-Instruct-q4f32_1-MLC | 0.9 / 1.1 GB | Llama 3.2 Community Licence | Show "Built with Llama"; Acceptable Use Policy applies |
| Quality | Qwen3-4B-q4f16_1-MLC | Qwen3-4B-q4f32_1-MLC | 3.4 / 4.3 GB (≈2.2 GB download) | Apache-2.0 | Keep licence notice; thinking mode off |

Rejected: Qwen2.5-3B-Instruct (Qwen Research licence, non-commercial). Gemma models (custom terms; not needed).
Removed (2026-11-26): the Balanced tier, Qwen2.5-1.5B-Instruct (Apache-2.0). In real-model tests it answered a chest-pain message with a product spec instead of telling the person to call emergency services, invented three studies when asked for sources, gave 20% for a 50% lift and copied the persona's example users into an unrelated plan. Quality is now the default on laptops; Lite stays for phones and low-memory devices and as the out-of-memory fallback (it is weak too: wrong maths and it followed a takeover prompt, so the app's emergency notice and the Quality tier carry the load).
Replaced (2026-11-26): Phi-4-mini-instruct (MIT). In a real-model test on a Mac it often ran to the token limit instead of ending its answer, even with a corrected chat template (3 of 10 test prompts). Qwen3-4B ended all 14 test answers, including Studio JSON.
Studio JSON mode passes a JSON Schema (`SPEC_JSON_SCHEMA`): WebLLM 0.2.89 fails to start JSON mode without one, on every model.

## Where downloads come from
- Weights: `https://huggingface.co/mlc-ai/<model>` (redirects to `*.hf.co` CDN hosts).
- Model library (.wasm): `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/...`.
These hosts are the only external origins in the app's Content Security Policy.
