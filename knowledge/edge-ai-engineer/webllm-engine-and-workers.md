# WebLLM engine setup, streaming and workers

- Source: Basic Usage — web-llm 0.2.89 documentation — https://webllm.mlc.ai/docs/user/basic_usage.html (accessed 2026-11-28); supporting page: Advanced Use Cases — https://webllm.mlc.ai/docs/user/advanced_usage.html (accessed 2026-11-28)
- Publisher: MLC (the WebLLM project)
- Licence: Apache-2.0 (declared in the web-llm npm package metadata) · Copy in repo: link only

Why this matters for edge-ai-engineer: the site pins web-llm 0.2.89, and these two pages for that exact version define how the chat engine is created, streamed, moved into a worker and cached.

## Key facts
- Every prebuilt model is a `ModelRecord` in `webllm.prebuiltAppConfig.model_list`; copy IDs from there, never by hand.
- Two ways to create the engine:
  - `CreateMLCEngine(modelId, { initProgressCallback })`: creates and loads in one call.
  - `new MLCEngine({ initProgressCallback })` then `await engine.reload(modelId)`: create first, load later (useful behind a consent click).
- `initProgressCallback` receives loading progress; the first load without a cache downloads weights and can take a long time, so the call must be awaited and its errors handled.
- Chat uses OpenAI-style `engine.chat.completions.create({ messages })`; the reply has `choices[0].message` and `usage`.
- The `model` field in a request is ignored. To switch models call `engine.reload(otherId)` or create a new engine.
- Streaming: `stream: true` returns an async generator; read it with `for await`. `stream_options: { include_usage: true }` puts `usage` on the last chunk. `engine.getMessage()` returns the full reply so far.
- Web Worker: the worker script creates `new WebWorkerMLCEngineHandler()` and forwards each message to `handler.onmessage(msg)`; the page calls `CreateWebWorkerMLCEngine(new Worker(...), modelId, opts)`. The returned engine only forwards calls; the work happens in the worker.
- Service Worker: create `ServiceWorkerMLCEngineHandler` at the top level of the service worker (not inside an `activate` or `message` listener); the page calls `CreateServiceWorkerMLCEngine(modelId, opts)`. It sends heartbeats, but the browser may still kill the worker, so handle errors.
- Cache backends: the Cache API by default; IndexedDB with `appConfig.cacheBackend = "indexeddb"` (spread `prebuiltAppConfig` first); `"cross-origin"` storage is experimental and falls back to the default.
- WebLLM never requests a WebGPU buffer over 1 GiB, so custom models must split larger weights when converted.
- Custom model records use `model_id`, `model`, `model_lib` and an optional `model_manifest` (`mlc-model-manifest.json`, relative to the model URL).
- `logit_bias` with a value such as -100 effectively bans a token.
- Image input works only with custom LLaVA builds; audio input is experimental with no prebuilt record. The site should treat both as unavailable.
- A WebGPU-capable browser is required; the docs suggest a recent Chrome.

## How to apply it here
- Engine wrapper for the on-device chat:
  1. Capability check first (see the WebGPU note); no engine is created before it passes.
  2. Create the engine with `new MLCEngine` or the worker variant, but call `reload(modelId)` only after the visitor clicks a button that names the model and its size.
  3. Show `initProgressCallback` progress in the UI with a Cancel path.
  4. Stream with `stream: true` and `include_usage`, render deltas as they arrive, and log `usage` for the token budget.
  5. Keep inference in a dedicated Web Worker; prefer it over a Service Worker, which the browser may stop.
- One engine per tab; switching models means `reload`, not a new request field.
- If storage quota is tight, test the IndexedDB backend, but keep the Cache API default unless a measured problem exists.
- Record in the ADR: pinned version 0.2.89, exact model IDs from `model_list`, cache backend, and the device used for measurements.
- Mock engine for tests: same methods (`reload`, `chat.completions.create`, `getMessage`) so the UI runs in CI without a GPU.

| UI state | Engine call | What the visitor sees |
|---|---|---|
| Not started | none | Button naming model and size |
| Downloading | `reload` with progress | Progress bar, Cancel |
| Ready | none | Input enabled |
| Answering | `chat.completions.create` stream | Text appears, Stop works |
| Failed load | error from `reload` | Reason and a smaller-model or copy-prompt option |

## Limits
- These pages do not list `interruptGenerate`, `hasModelInCache` or `deleteModelAllInfoInCache`; those names come from the shared WebLLM note read from the package itself, not from these pages.
- Licence: no licence line was found on the docs pages; Apache-2.0 is the package's declared licence (seen on a package registry listing for 0.2.89).
- Docs pages for older releases (0.2.84–0.2.88) are still indexed; always open the 0.2.89 copy.
