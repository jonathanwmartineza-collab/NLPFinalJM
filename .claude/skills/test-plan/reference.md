# Test Plan — reference

Linked from [SKILL.md](SKILL.md). Check versions against the official docs before pinning:
Playwright https://playwright.dev/docs/test-configuration, Vitest https://vitest.dev/guide/,
axe for Playwright https://playwright.dev/docs/accessibility-testing (accessed 2026-11-21).

## 1. Evidence wrapper (records command, exit code and last 15 lines)
```bash
# usage: scripts/gate.sh "<Gate name>" <command...>
#!/usr/bin/env bash
set -u
name="$1"; shift
log="$(mktemp)"
"$@" >"$log" 2>&1; code=$?
result=$([ $code -eq 0 ] && echo PASS || echo FAIL)
{
  echo ""; echo "### $name — $result"
  echo "- Date: $(date -u +%Y-%m-%dT%H:%MZ)"
  echo "- Command: \`$*\`"
  echo "- Exit code: $code"
  echo '```text'; tail -n 15 "$log"; echo '```'
} >> reports/gates.md
echo "$name: $result (exit $code)"
exit $code
```
Example: `bash scripts/gate.sh "Unit" npx vitest run`. If a gate cannot run, append an entry by hand
with `Result: NOT RUN`, the reason, and no output block. NOT RUN is never a pass.

## 2. `reports/gates.md` entry shape
```markdown
### E2E — FAIL
- Date: 2026-11-21T14:05Z
- Command: `npx playwright test`
- Exit code: 1
```text
<last 15 lines exactly as printed>
```
- Fix round: 1 of 2 · Next action: <one line>
```

## 3. `playwright.config.ts` using the preinstalled Chrome
```ts
import { defineConfig, devices } from "@playwright/test";
const executablePath = process.env.CHROME_PATH || undefined;   // e.g. /usr/bin/google-chrome
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,            // a retry that passes is still reported as flaky
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure", launchOptions: { executablePath } },
  webServer: { command: "npm run build && npx vite preview --port 4173", url: "http://localhost:4173", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
    { name: "mobile",  use: { ...devices["Pixel 7"],        launchOptions: { executablePath } } },
  ],
});
```
Device presets set their own browser options, so repeat `launchOptions` per project as shown.

## 4. E2E with a stubbed AI function (streamed answer, error paths)
```ts
import { test, expect } from "@playwright/test";
test("answer streams into the chat", async ({ page }) => {
  await page.route("**/.netlify/functions/chat", route => route.fulfill({
    status: 200, contentType: "text/event-stream",
    body: 'data: {"text":"Hello"}\n\ndata: {"text":" there"}\n\ndata: [DONE]\n\n' }));
  await page.goto("/");
  await page.getByLabel("Message").fill("Hi team");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Hello there")).toBeVisible();
});
for (const [status, msg] of [[401, /password/i], [429, /too many|slow down/i], [500, /try again/i]] as const) {
  test(`shows a helpful error on ${status}`, async ({ page }) => {
    await page.route("**/.netlify/functions/chat", r => r.fulfill({ status, body: "{}" }));
    await page.goto("/");
    await page.getByLabel("Message").fill("Hi");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("alert")).toContainText(msg);
  });
}
```
Adjust the route, labels and messages to the app; these are shapes, not the app's real strings.

## 5. Accessibility scan with axe
```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("home has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/");
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = r.violations.filter(v => v.impact === "serious" || v.impact === "critical");
  expect(bad.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
```
Repeat for each important state (open dialog, error shown, empty list). Log moderate/minor violations in
the report even though they do not fail the gate.

## 6. Vitest for a serverless function handler
```ts
// vitest.config.ts → export default { test: { environment: "node", include: ["tests/unit/**/*.test.ts"] } }
import { describe, it, expect, vi } from "vitest";
import handler from "../../netlify/functions/chat";
describe("chat function", () => {
  it("rejects GET with 405", async () => {
    const res = await handler(new Request("http://x/chat", { method: "GET" }), {} as any);
    expect(res.status).toBe(405);
  });
  it("rejects an oversized message with 400", async () => {
    const body = JSON.stringify({ message: "x".repeat(20_000) });
    const res = await handler(new Request("http://x/chat", { method: "POST", body }), {} as any);
    expect(res.status).toBe(400);
  });
});
```
Mock the AI SDK with `vi.mock("@anthropic-ai/sdk", ...)` so unit tests never call the network.

## 7. Manual keyboard pass (record results in the report)
Tab through every page: focus visible on every control; order follows reading order; no trap; Escape
closes dialogs and returns focus to the opener; Enter/Space activate buttons; skip link works; 200% zoom
and 320 px width show no lost content or horizontal scroll (except data tables).
