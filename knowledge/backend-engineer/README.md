# Knowledge index: backend-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Validate every input with a schema; cap body size.
- Consistent error shape; never leak internals.
- Rate limits sized to real fan-out; secrets only server-side.

## Notes
- [One error shape for HTTP APIs (RFC 9457 Problem Details)](problem-details-error-shape.md): when designing error responses or validation failures for an endpoint
- [OWASP API Security Top 10 (2023 edition)](owasp-api-top-10-2023.md): when reviewing any endpoint, webhook or password gate
- [Netlify Functions: what they are and when to use them](netlify-functions-overview.md): before proposing server code on Netlify (this repo has none)
- [Netlify platform for our apps](../_shared/netlify-platform.md)
- [Web and LLM application security](../_shared/llm-and-web-security.md)
- [Claude API (5.5 models) for web features](../_shared/claude-api-5-5.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-28.
