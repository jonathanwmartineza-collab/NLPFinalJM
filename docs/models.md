# Models and licences

Checked 2026-11-22 against `@mlc-ai/web-llm` 0.2.89 (`prebuiltAppConfig.model_list`). `tests/unit/models.test.ts` fails if an ID disappears.

| Tier | f16 build (shader-f16) | f32 build (fallback) | Est. VRAM | Licence | Conditions |
|---|---|---|---|---|---|
| Lite | Llama-3.2-1B-Instruct-q4f16_1-MLC | Llama-3.2-1B-Instruct-q4f32_1-MLC | 0.9 / 1.1 GB | Llama 3.2 Community Licence | Show "Built with Llama"; Acceptable Use Policy applies |
| Balanced | Qwen2.5-1.5B-Instruct-q4f16_1-MLC | Qwen2.5-1.5B-Instruct-q4f32_1-MLC | 1.6 / 1.9 GB | Apache-2.0 | Keep licence notice |
| Quality | Phi-4-mini-instruct-q4f16_1-MLC | Phi-4-mini-instruct-q4f32_1-MLC | 3.4 / 4.2 GB | MIT | Keep licence notice |

Rejected: Qwen2.5-3B-Instruct (Qwen Research licence, non-commercial). Gemma models (custom terms; not needed).

## Where downloads come from
- Weights: `https://huggingface.co/mlc-ai/<model>` (redirects to `*.hf.co` CDN hosts).
- Model library (.wasm): `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/...`.
These hosts are the only external origins in the app's Content Security Policy.
