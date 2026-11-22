---
name: "test-plan"
description: "Use when a feature, fix or release needs to be proven working: writing a test plan, adding unit (Vitest), end-to-end (Playwright) or accessibility (axe) tests, or running quality gates. Produces a risk-based test plan, the tests, and evidence entries in reports/gates.md (command + last 15 lines of output), with NOT RUN never counted as a pass."
---
# Test Plan

## Purpose
Prove the software works with evidence a reviewer can check, spending test effort where failure would
hurt most. Every gate result is backed by the exact command and the tail of its real output. Config
snippets, test skeletons and the gates.md format are in [reference.md](reference.md).

## Procedure
1. **Collect inputs.** Requirements or acceptance criteria, the list of changed files, the architecture
   note, and the key user journeys. If acceptance criteria are missing, write them as Given/When/Then and
   flag them as assumed.
2. **Rate risks.** For each feature or journey score Likelihood (1–3) × Impact (1–3). Likelihood rises
   with new or complex code, many branches, external calls, concurrency. Impact rises with money, data
   loss, privacy, security, the main journey, or many users.
   | Score | Depth |
   |---|---|
   | 6–9 high | unit tests for logic and errors + E2E happy and failure paths + a11y + responsive |
   | 3–4 medium | unit tests for logic + one E2E path |
   | 1–2 low | smoke check only |
3. **Pick levels and tools.**
   - Unit / integration: **Vitest** for pure logic, validators, reducers, and serverless function
     handlers called directly with a `Request` and a mocked `fetch` / SDK.
   - End-to-end: **Playwright** for critical journeys in a real browser against the built app
     (`vite preview` or `netlify dev`), not the dev server.
   - Accessibility: **axe** (`@axe-core/playwright`) on every key page and state (empty, loading, error,
     open dialog), plus a manual keyboard pass, since automated rules catch only part of WCAG.
   - Responsive: viewports 375×812, 768×1024, 1280×800.
4. **Set up the browser without downloads.** Prefer the preinstalled Chrome: if `CHROME_PATH` is set
   (check `echo $CHROME_PATH`), pass it as `launchOptions.executablePath` in `playwright.config.ts`.
   Only if no Chrome exists, run `npx playwright install chromium`, and note it in the report.
5. **Stub external services.** Intercept calls to the AI function or third-party APIs with
   `page.route` and return fixed responses (including streamed chunks, 401, 429, 500, timeout) so tests are
   fast, free and repeatable. Keep at most one clearly labelled live smoke test, run on demand.
6. **Write test cases** in the plan table: ID, requirement, preconditions, steps, expected result,
   priority. Always include negative and edge cases that fit the feature: empty and over-long input,
   wrong password (401), rate limit (429), server error, stream cut mid-answer, offline, double submit,
   back/refresh, keyboard-only use, 200% zoom.
7. **Write the tests.** Use role- and label-based locators (`getByRole`, `getByLabel`), web-first
   assertions (`await expect(...).toBeVisible()`), no fixed `waitForTimeout`. One behaviour per test,
   named after the requirement. Unit tests are fast (<100 ms each) and need no network.
8. **Run gates in order**, stopping at the first failure: typecheck/lint → unit → build → E2E → a11y.
9. **Record evidence for every gate** in `reports/gates.md`: the gate name, date, the exact command, the
   exit code, PASS / FAIL / NOT RUN, and the **last 15 lines of real output** in a code block (use the
   wrapper in reference.md). Rules:
   - A gate passes only when the command ran and exited 0 with the expected output.
   - **NOT RUN never counts as a pass**, whatever the reason (missing tool, no network, time). Say why.
   - Never paraphrase, trim or invent output; paste the tail as produced.
10. **Fix loop: maximum 2 rounds.** On failure: diagnose, fix the code or the test (only fix a test if the
    test is wrong, and say so), re-run that gate and everything after it. After 2 rounds still failing,
    stop, mark FAIL, and report the blocker with the failing output and your best diagnosis.
11. **Report** using the template. List what was not tested and why; that is part of the evidence.

## Checklist
- [ ] Acceptance criteria collected or written (assumptions flagged)
- [ ] Every feature risk-scored; test depth matches the score
- [ ] Vitest covers logic, validators and function handlers (success and error paths)
- [ ] Playwright covers each high-risk journey against the built app
- [ ] Preinstalled Chrome used via CHROME_PATH; any browser download noted
- [ ] External APIs stubbed; any live test clearly labelled
- [ ] Negative cases: empty, too long, 401, 429, 500, stream cut, offline, double submit
- [ ] axe run on key pages and states with WCAG 2.x A/AA tags; zero serious/critical violations
- [ ] Manual keyboard pass done (focus order, visible focus, no traps, Escape closes dialogs)
- [ ] Three viewports checked
- [ ] Locators role/label-based; no fixed sleeps
- [ ] Every gate logged in reports/gates.md with command, exit code, last 15 lines
- [ ] No NOT RUN gate reported as passing
- [ ] At most 2 fix rounds; remaining failures reported as blockers

## Output template
```markdown
# Test plan and results: <feature / release>
Date: YYYY-MM-DD · Owner: qa-engineer · Build: <commit or deploy ID if known>

## Scope
In: <features> · Out (not tested, why): <list>

## Risk table
| Feature / journey | L (1–3) | I (1–3) | Score | Depth |
|---|---|---|---|---|

## Test cases
| ID | Requirement | Level | Steps (short) | Expected | Priority | Status |
|---|---|---|---|---|---|---|

## Gate summary (details and output tails in reports/gates.md)
| Gate | Command | Exit | Result |
|---|---|---|---|
| Typecheck/lint | | | PASS / FAIL / NOT RUN (why) |
| Unit | | | |
| Build | | | |
| E2E | | | |
| Accessibility | | | |

## Fix rounds
1. <what failed → what changed → result>
2. <...> (stop here)

## Blockers and risks remaining
- ...

## Verdict
READY / NOT READY — <one sentence>
```
