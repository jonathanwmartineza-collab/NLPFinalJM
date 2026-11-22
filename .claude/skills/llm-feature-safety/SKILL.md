---
name: "llm-feature-safety"
description: "Use when building or reviewing any feature that calls an AI model: prompt-injection defences, output sanitising, sandboxing generated code, spend controls, server-chosen parameters and privacy-safe logging."
---
# LLM feature safety

## Procedure
1. Trust boundary: user text, pasted content, files and model output are data, never instructions. System prompts say so explicitly. Never let model output choose tools, URLs or permissions without checks.
2. Server decides model, effort, max_tokens and system prompt; the browser sends only the user's content and an allowed mode/agent id.
3. Output handling: render Markdown without raw HTML; allow only http(s)/mailto links with `rel="noopener noreferrer nofollow"`; show remote images as links (prevents data exfiltration via image URLs).
4. Generated code: run only in a separate sandbox document served with `Content-Security-Policy: sandbox allow-scripts …; connect-src 'none'`, embedded with `<iframe sandbox="allow-scripts">` (never `allow-same-origin`); pass content by postMessage and check `event.source`. Never open generated code as a blob/data URL on your origin.
5. Spend: fail closed (AI off until a password or explicit public mode is set), a global daily budget and a per-visitor quota, a kill switch, rate limits sized for real fan-out, and a provider-side spend limit.
6. Limits: cap message length, history length, number of parallel calls, and synthesis input; sign multi-step runs so steps can't be replayed or inflated.
7. Logging: metadata only (mode, model, tokens, latency, status); never prompts, answers or personal data.
8. Model rules for Claude 5.5 models: no temperature/top_p/top_k, no assistant prefill, no manual thinking budgets; effort via `output_config.effort`; handle `refusal` stop reasons and 429/529 gracefully.

## Checklist
- [ ] Injection test cases tried (ignore-previous-instructions, fake system messages, prompt-leak requests).
- [ ] Generated HTML can't read cookies/storage or call our API.
- [ ] Budget, quota, kill switch and rate limits verified.
- [ ] Logs contain no content.

## Output template
| Risk | Control | Where in code | Test | Status |
