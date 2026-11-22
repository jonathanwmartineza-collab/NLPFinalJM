# Testing and evidence
Why this matters: "done" means proven. Every check records its command and output.

- Unit: Vitest for pure logic and function handlers (call the exported handler with a `Request`).
- End-to-end: Playwright against the built site with the model mocked (MOCK_MODEL=1). Use a preinstalled Chrome (`CHROME_PATH`) in cloud sessions; only download browsers if none exist.
- Accessibility: @axe-core/playwright on every page, light and dark; plus manual keyboard and screen-reader passes.
- Performance: Lighthouse mobile, median of 3 runs.
- Evidence rule: write the command and the last 15 lines of output to reports/gates.md; anything without output is NOT RUN; never lower thresholds; at most 2 fix rounds.

Sources: https://vitest.dev/guide/ , https://playwright.dev/docs/intro , https://github.com/dequelabs/axe-core-npm (accessed 2026-11-21)
