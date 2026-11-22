# ADR 0006: Model tiers and licences

Date: 2026-11-22 · Status: accepted

## Decision
Three tiers, with permissive licences only (see `docs/models.md`): Lite = Llama-3.2-1B, Balanced = Qwen2.5-1.5B (default), Quality = Phi-4-mini. The q4f16 build is used when the adapter has `shader-f16`, otherwise q4f32. The tier is recommended from `navigator.deviceMemory` and the device type, and the visitor always chooses.

## Consequences
"Built with Llama" is shown with the Lite tier. Qwen2.5-3B is excluded (non-commercial licence). Model IDs are tested against the pinned package.
