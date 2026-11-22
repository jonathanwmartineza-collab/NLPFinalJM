---
name: "api-design"
description: "Use when designing or reviewing an HTTP API or serverless endpoint: resource shapes, validation with schemas, errors, auth, idempotency, pagination, rate limits and versioning."
---
# API design

## Procedure
1. Name resources as nouns; one purpose per endpoint. Prefer JSON over HTTPS; POST for actions with side effects.
2. Validate every input at the edge with a schema (zod): types, lengths, enums; reject unknown fields; cap body size.
3. Errors: consistent shape `{ "code": "snake_case", "message": "human sentence", "details"?: … }` with correct status (400 invalid, 401 not signed in, 403 forbidden, 404, 409 conflict, 413 too large, 429 limited with reset time, 5xx ours). Never leak stack traces.
4. Auth: server-side checks on every call; httpOnly, Secure, SameSite cookies or bearer tokens; least privilege.
5. Idempotency keys for payments/creates; pagination with cursors; ETags for caching where useful.
6. Rate limits and quotas sized to real usage; return Retry-After.
7. Observability: structured logs with request id, no personal data or message content.
8. Version only when breaking; document with examples.

## Checklist
- [ ] Every input validated; body size capped.
- [ ] Error shape consistent; no internals leaked.
- [ ] Auth enforced server-side; secrets never sent to clients.
- [ ] Limits and retries documented.

## Output template
| Method | Path | Auth | Request schema | Responses | Limits |
