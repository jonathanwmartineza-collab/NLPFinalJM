# WebLLM: on-device models in the browser

Sources (accessed 2026-11-22): https://github.com/mlc-ai/web-llm (README, src/config.ts) ·
https://webllm.mlc.ai/models/ · npm `@mlc-ai/web-llm` 0.2.89 (`prebuiltAppConfig.model_list`, read locally).

## What it is
- WebLLM runs MLC-compiled open models in the browser on WebGPU. API mirrors OpenAI chat completions:
  `engine.chat.completions.create({ messages, stream: true })`; `engine.interruptGenerate()` stops.
- `CreateWebWorkerMLCEngine(new Worker(...), modelId, { initProgressCallback })` keeps inference off the
  main thread; the worker file just does `new WebWorkerMLCEngineHandler()` and forwards `onmessage`.
- Weights download on first use from Hugging Face (`huggingface.co/mlc-ai/<model>`; redirects to `*.hf.co`
  CDN hosts). The model library (.wasm) comes from `raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs`.
- Downloads are cached in the browser (Cache API by default; IndexedDB option). Helpers:
  `hasModelInCache(id)`, `deleteModelAllInfoInCache(id)`.
- Default context window: 4,096 tokens for the small models (`overrides.context_window_size`).
- Needs WebGPU. Some builds need the `shader-f16` feature; q4f32 variants avoid that requirement.

## Small models in 0.2.89 (est. VRAM from model_list)
| Model ID | VRAM | Licence |
|---|---|---|
| Llama-3.2-1B-Instruct-q4f16_1-MLC | 0.9 GB | Llama 3.2 Community Licence ("Built with Llama") |
| Qwen2.5-1.5B-Instruct-q4f16_1-MLC | 1.6 GB | Apache-2.0 |
| Phi-4-mini-instruct-q4f16_1-MLC | 3.4 GB | MIT |
| Qwen2.5-3B-Instruct-q4f16_1-MLC | 2.5 GB | Qwen Research licence (non-commercial): avoid for a public product |

## Rules of thumb
- Small models: good at short advice and filling JSON; poor at long code. Keep answers short.
- Budget the 4K context in code: system + history + input + output + margin.
- Ask before downloading; show size and progress; offer "delete downloaded models".
- One engine per tab; warn when another tab already runs the model (memory).
