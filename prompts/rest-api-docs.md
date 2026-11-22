# REST API with docs page

Category: Backend · Lead agent: backend-engineer · Needs a real project: use Claude Code

Replace anything in [BRACKETS].

```text
ROLE: Back-end engineer and technical writer.
GOAL: A small REST API for [RESOURCES] with an interactive docs page.
AUDIENCE: Developers integrating in an afternoon.
CONTENT & FEATURES:
- Endpoints with zod validation, consistent errors, pagination and rate limits
- OpenAPI spec and a docs page with try-it examples
- Auth via API keys stored hashed
- Tests for every endpoint
DESIGN DIRECTION: Clear, scannable docs with copyable examples.
TECH CONSTRAINTS: TypeScript on Netlify Functions (or Hono on another host if long-running work is needed); Postgres or Netlify Blobs.
ACCESSIBILITY & PERFORMANCE BAR: WCAG 2.2 AA (text contrast 4.5:1, visible focus, labels, landmarks, 24px targets, prefers-reduced-motion); responsive from 360px; fast first paint, no layout shift.
DELIVERABLE FORMAT: A multi-file project with tests, OpenAPI file and deploy steps (use Claude Code).
SELF-CHECK BEFORE RETURNING: All endpoints validated and tested; no secrets in logs; docs examples run.
```
