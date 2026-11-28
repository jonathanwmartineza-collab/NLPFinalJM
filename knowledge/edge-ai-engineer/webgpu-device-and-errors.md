# WebGPU: getting a device, errors and device loss

- Source: WebGPU API — https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API (accessed 2026-11-28); supporting page: GPUDevice: lost property — https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost (accessed 2026-11-28); supporting page: GPU: requestAdapter() method — https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter (accessed 2026-11-28)
- Publisher: Mozilla (MDN Web Docs)
- Licence: CC-BY-SA-2.5 (MDN prose, "or later"; code samples CC0) · Copy in repo: link only

Why this matters for edge-ai-engineer: the on-device chat only works when WebGPU does; the capability check, the out-of-memory message and the recovery after a lost GPU all rest on these APIs.

## Key facts
- WebGPU lets pages use the system GPU for computation and drawing; it is the successor to WebGL and adds general-purpose compute.
- Status on MDN: "Limited availability" and not Baseline, because it does not work in some widely used browsers.
- The whole API is available only in secure contexts (HTTPS).
- In a worker, the entry point is `WorkerNavigator.gpu` (same `GPU` object type as `navigator.gpu`), so the check can run inside the model worker.
- Access chain:
  1. `navigator.gpu` missing → no WebGPU.
  2. `await navigator.gpu.requestAdapter(options)` resolves to `null` when no appropriate adapter is available (requestAdapter page). Options: `featureLevel` (`"core"` default or `"compatibility"`) and `powerPreference` (`"low-power"` or `"high-performance"`).
  3. `await adapter.requestDevice(descriptor)` with the features and limits you need; without a descriptor you get a general-purpose device.
- `requestDevice()` never returns `null`; it rejects only for an invalid request beyond the adapter's abilities. A valid request that cannot be met may resolve to a device that is already lost.
- Compatibility mode: `requestAdapter({ featureLevel: "compatibility" })` limits the adapter to what runs on OpenGL ES 3.1 and Direct3D 11. Core devices report the feature `core-features-and-limits`.
- `GPUSupportedFeatures` (set-like) and `GPUSupportedLimits` describe what an adapter or device supports.
- Errors are contagious: an invalid call makes dependent objects invalid.
- Error scopes: `device.pushErrorScope(type)` then `await device.popErrorScope()`, which resolves to the first `GPUValidationError`, `GPUOutOfMemoryError` or `GPUInternalError` in the scope, or `null`.
  - `GPUOutOfMemoryError`: not enough free memory for the operation.
  - `GPUValidationError`: the call broke WebGPU's validation rules.
  - `GPUInternalError`: a system or implementation failure despite valid calls.
- UNVERIFIED: errors outside any scope fire the device's `uncapturederror` event (the overview lists the event but does not say when it fires).
- `device.lost` is a promise that stays pending for the device's life and resolves with a `GPUDeviceLostInfo` (`message`, `reason`) when the device is lost.
- Devices can be lost at any time, for example through browser resource management or driver updates. An adapter whose GPU was unplugged or powered down only returns already-lost devices.
- Recovery: many causes are temporary, so request a new device unless the app called `device.destroy()` (reason `"destroyed"`). Everything made on the old device must be recreated.

## How to apply it here
- Capability check before showing the download button:
  1. Page is HTTPS (Netlify deploy previews and production both are).
  2. `navigator.gpu` exists; else show "This browser has no WebGPU" plus the copy-the-prompt fallback.
  3. `requestAdapter()` is not `null`; else "No compatible graphics adapter found".
  4. Check the adapter's features for `shader-f16` before offering a q4f16 model, and offer the q4f32 variant otherwise (feature name from the shared WebLLM note; not on these MDN pages).
- Treat a `GPUOutOfMemoryError` during load or the first answer as "model too big": offer the smaller tier. (The scope filter string to pass to `pushErrorScope` is not given on these pages; take it from the WebGPU specification: UNVERIFIED here.)
- Listen to `device.lost` (through the engine where possible): on any reason except `"destroyed"`, tell the visitor the GPU reset, then reload the engine; do not loop more than once without a click.
- Log `uncapturederror` events in debug builds only; never show raw GPU messages to visitors.
- Tests: the mock engine path covers the no-WebGPU and lost-device messages; a real-GPU test is NOT RUN unless the runner has WebGPU.

| Failure | Detected by | Visitor message | Action |
|---|---|---|---|
| No WebGPU | `navigator.gpu` missing | Browser not supported | Copy-prompt fallback |
| No adapter | `requestAdapter()` is `null` | No compatible GPU | Copy-prompt fallback |
| Out of memory | `GPUOutOfMemoryError` | Model too big for this device | Offer smaller model |
| Device lost | `device.lost` resolves | Graphics reset | Reload engine once |

## Limits
- The MDN overview gives no per-browser version table in the fetched text and does not name `requiredFeatures` or `requiredLimits`, or the `shader-f16` feature (only the requestAdapter page names `powerPreference`): check the W3C WebGPU specification before coding against those names.
- No `webgpu` Permissions-Policy guidance was on these pages.
- Licence line follows MDN's attribution guidelines; the article footer itself names only a Creative Commons licence without the version.
