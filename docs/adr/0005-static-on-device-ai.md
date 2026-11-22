# ADR 0005: Static site with on-device AI (supersedes 0002 and 0003)

Date: 2026-11-22 · Status: accepted

## Context
A server-side design calls a hosted model through Netlify Functions, which costs money per answer. This edition must be free for anyone.

## Options
1. Free hosted APIs (Groq, Gemini, OpenRouter free tiers): need keys on a server, have daily caps shared by every visitor, and send data to third parties.
2. In-browser models with WebLLM on WebGPU: no keys and no per-answer cost, private, but they need a capable device and a large first download.

## Decision
Option 2. The site is fully static. WebLLM 0.2.89 runs in a Web Worker (`CreateWebWorkerMLCEngine`), is lazy-loaded after the visitor agrees to the download, and is limited to one engine per browser (Web Locks).

## Consequences
- No functions, env vars, budgets or rate limits. Hosting stays on the free plan.
- Devices without WebGPU get a clear message and a copy-the-prompt fallback.
- Real-model tests need a WebGPU device. CI uses a mock engine with the same interface.
