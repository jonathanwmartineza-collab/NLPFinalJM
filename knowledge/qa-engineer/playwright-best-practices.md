# Playwright best practices for this site's end-to-end tests

- Source: Best Practices — https://playwright.dev/docs/best-practices (accessed 2026-11-28)
- Publisher: Playwright project (Microsoft)
- Licence: Apache-2.0 · Copy in repo: link only

Why this matters for qa-engineer: the e2e suite in tests/e2e runs on preinstalled Chrome against a mock-engine
build. These rules are what keep it deterministic: user-facing locators, web-first assertions, isolated tests and
no live third-party calls.

## Key facts
- Test what users see and do, not function names, data structures or CSS classes.
- Keep every test isolated: its own storage, cookies and data. Shared setup goes in `test.beforeEach`.
- Do not test services you do not control; mock them with `page.route()` and `route.fulfill()`.
- For visual regression, pin the OS and browser version.
- Locators: prefer user-facing ones such as `getByRole()`; CSS and XPath break when the DOM changes.
  Narrow with chaining and `.filter({ hasText })`. `npx playwright codegen` helps find locators.
- Assertions: use web-first ones, e.g. `await expect(locator).toBeVisible()`, which retry until true.
  Avoid `expect(await locator.isVisible())`, which does not wait.
- `expect.soft()` records a failure and lets the test continue.
- Debugging: `npx playwright test --debug`, or one line with `file.spec.ts:9 --debug`; UI Mode for watch-style runs.
- On CI prefer the trace viewer over videos and screenshots; record traces on the first retry, because `on` for
  every test is slow. `npx playwright show-report` opens the report.
- Cross-browser: define Chromium, Firefox and WebKit projects in `playwright.config.ts` with `devices`.
- CI: run on every commit and pull request; Linux is cheaper; install only needed browsers
  (`npx playwright install chromium --with-deps`); shard big suites with `--shard=1/3`.
- Tests in different files run in parallel by default; in one file use
  `test.describe.configure({ mode: 'parallel' })` for independent tests.
- Lint with the typescript-eslint rule `no-floating-promises` to catch a missing `await`; run `tsc --noEmit` on CI.
- Keep current: the npm install of the latest Playwright Test package, read the release notes, check `npx playwright --version`.

## How to apply it here
- This repo's `playwright.config.ts`: `testDir: 'tests/e2e'`, 45 s timeout, `trace: 'off'`, one `chrome` project
  using `CHROME_PATH` or `/usr/bin/google-chrome`. Run with `npm run test:e2e`.
- The web server builds with `VITE_MOCK_ENGINE=1` and serves on port 8899, so no model download or GPU is needed.
  That is this repo's version of "mock what you do not control".
- `PW_ALL_BROWSERS=1` adds Firefox, WebKit, iPhone and Android projects; those need extra browser installs, which
  this agent does not run. Without them, cross-browser rows are NOT RUN.
- `PW_BASE_URL` points the suite at a deployed site; mock-only tests skip themselves there.
- Trace is off by default here; when a CI failure needs diagnosis, re-run that spec with `--trace on`.
- Checklist for a new spec:
  - [ ] `getByRole` / `getByLabel` locators, no CSS chains.
  - [ ] Every check is `await expect(...)`, no `waitForTimeout`.
  - [ ] Any outside host (model CDN, fonts) is blocked or routed with `page.route()`.
  - [ ] Test does not depend on another test's state.
- The axe-core Playwright package is installed for accessibility scans inside e2e runs.

## Limits
- The page has no rules on accessibility scanning, WebGPU or WebLLM; browser-model checks stay manual or NOT RUN.
- The docs footer names no licence; the Apache-2.0 line comes from the project repository's LICENSE file.
