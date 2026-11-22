# Launch readiness: BrainyApp2

Red-team release gate (Morgan) against docs/MASTER_PROMPT.md §3. Date: 2026-11-22. Evidence: reports/gates.md.

| Requirement | Result | Evidence |
|---|---|---|
| 1. No link to or mention of a private edition | PASS | Gate "No server AI, secrets or private-edition links"; repo-wide grep clean |
| 2. WebLLM pinned; model IDs exist in the package | PASS | package.json `@mlc-ai/web-llm` 0.2.89 exact; tests/unit/models.test.ts |
| 3. Permissive-licence tiers, f16/f32 by adapter | PASS | models.test.ts; headless Chrome (SwiftShader, no shader-f16) requested the q4f32 build |
| 4. Nothing downloads before consent; progress, cancel, persist, delete | PASS | e2e "nothing downloads before consent", "download shows progress", "privacy … delete models" |
| 5. Worker engine, lazy, one per browser, stall/OOM/device recovery | PARTIAL | Worker + lazy chunk verified in a production build (worker created, CSP allowed, real request to Hugging Face). Lock, stall and OOM paths are code-reviewed only: **NOT RUN** on real hardware |
| 6. Token budget enforced and tested | PASS | build-team.test.ts, router.test.ts (fitHistory) |
| 7. Team mode: deterministic router, sequential experts, synthesis | PASS | router.test.ts; e2e "team mode" |
| 8. Studio: JSON fill, repair, fallback, escaping renderer, refine, Claude Code prompt | PASS | studio.test.ts (hostile input); e2e Studio flow; axe on all 12 blocks × 6 palettes × light/dark |
| 9. Static site only | PASS | netlify/ deleted; no functions; gate clean |
| 10. CSP without bare wildcard | PASS | Gate "No bare wildcard in the CSP" |
| 11. No-WebGPU state with copy fallback | PASS | e2e "no WebGPU" |
| 12. Model output treated as data | PASS | Markdown skipHtml; zod; escaping tests |
| 13. Privacy and Resources pages | PASS | e2e privacy; Resources lists licences |
| 14. Evidence rule | PASS | reports/gates.md |
| Real model on a WebGPU device (live site, owner's Chrome, Balanced) | PASS | 2026-11-22: consent → download ≈0.84 GB (30 shards, ~5 min) → "On your device · Balanced"; Ada answered on-device; Studio built a Massa Mae bakery page; team mode answered with 3 contributors |
| Live deploy | PASS | https://brainyapp2.netlify.app public; static build; nothing downloaded before the click |

Blockers: none.

Found and fixed in the live test: WebLLM 0.2.89 rejected `response_format: json_object` for Qwen2.5-1.5B (`GrammarMatcherInitError: Cannot pass non-string to std::string`), so the Studio showed an error. Fix 0cd9794: fall back to plain-text JSON, which `parseSpec` repairs. Confirmed live. Picker sizes were relabelled as graphics-memory needs, because the measured download is smaller.

Not run: the Lite and Quality tiers on real hardware, a phone, the Stop button and the two-tab lock on real hardware, and Lighthouse.
| Lighthouse | **NOT RUN** | Not installed in this environment; initial JS budget gate passes instead |
