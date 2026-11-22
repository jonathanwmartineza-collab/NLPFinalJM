# AI chat app

Category: AI · Lead agent: ai-engineer · Needs a real project: use Claude Code

Replace anything in [BRACKETS].

```text
ROLE: AI engineer and product designer.
GOAL: A streaming AI chat app for [DOMAIN] using the Claude API.
AUDIENCE: [USERS] who need trustworthy answers about [TOPIC].
CONTENT & FEATURES:
- Streaming chat with Markdown (no raw HTML) and copy buttons
- Server-side function holding the key; rate limits, budget and a kill switch
- System prompt with injection defences; conversation history caps
- Empty, thinking, error, rate-limited and offline states
DESIGN DIRECTION: Calm, readable chat UI with clear AI disclosure.
TECH CONSTRAINTS: Vite + React + TypeScript; Netlify Functions; @anthropic-ai/sdk with no arguments (Netlify AI Gateway or own key); claude-sonnet-5-5 by default.
ACCESSIBILITY & PERFORMANCE BAR: WCAG 2.2 AA (text contrast 4.5:1, visible focus, labels, landmarks, 24px targets, prefers-reduced-motion); responsive from 360px; fast first paint, no layout shift.
DELIVERABLE FORMAT: A multi-file project with tests and Netlify deploy (use Claude Code).
SELF-CHECK BEFORE RETURNING: No key in the client bundle; budget and rate limits tested; prompt-injection test cases pass.
```
