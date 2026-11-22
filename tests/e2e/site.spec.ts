import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, path = '/') {
  await page.goto(path);
  await page.getByRole('button', { name: 'Get started' }).click(); // the intro opens once the team has loaded
}
async function turnOnAI(page: Page, path = '/') {
  await open(page, path);
  await expect(page.getByRole('group', { name: /Turn on the free AI/ })).toBeVisible();
  await page.getByRole('button', { name: /^Download Balanced model/ }).click();
  await expect(page.getByRole('group', { name: /Turn on the free AI/ })).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole('progressbar')).toHaveCount(0, { timeout: 10_000 });
}

test('sidebar lists all 31 experts by department', async ({ page }) => {
  await open(page);
  expect(await page.locator('aside .row').count()).toBe(31); // 30 experts + "Ask the whole team" (Nova)
  for (const d of ['Leadership', 'Product', 'Design', 'Engineering', 'Quality', 'Launch', 'Governance']) await expect(page.getByRole('heading', { name: d })).toBeVisible();
  await page.getByLabel('Search experts').fill('Ada');
  await expect(page.locator('aside .row:not(.team)')).toHaveCount(1);
});

test('nothing downloads before consent; the picker shows sizes and licences', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) external.push(r.url()); });
  await open(page, '/expert/ui-designer');
  await expect(page.locator('#composer')).toHaveCount(0);
  await expect(page.getByText('Apache-2.0')).toBeVisible();
  await expect(page.getByText(/Built with Llama/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Balanced model' })).toBeVisible();
  await page.waitForTimeout(500);
  expect(external).toEqual([]);
});

test('download shows progress, then one expert streams an answer that survives a reload', async ({ page }) => {
  await open(page, '/expert/ui-designer');
  await page.getByRole('button', { name: /^Download Balanced model/ }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.locator('#composer')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('On your device · Balanced')).toBeVisible();
  await page.locator('#composer').fill('Suggest a palette for a calm yoga studio');
  await page.keyboard.press('Enter');
  await expect(page.locator('.msg.ai .md').last()).toContainText('Kai here (mock engine)');
  await expect(page.getByRole('status').filter({ hasText: 'Reply complete' })).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.msg.user')).toContainText('calm yoga studio');
  // The model is remembered as downloaded.
  await expect(page.getByRole('button', { name: 'Turn on AI (Balanced)' })).toBeVisible();
});

test('Stop interrupts an answer', async ({ page }) => {
  await turnOnAI(page, '/expert/ux-architect');
  await page.locator('#composer').fill('Explain onboarding flows');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.locator('#composer')).toBeEnabled();
});

test('team mode runs experts one after another and combines one answer', async ({ page }) => {
  await turnOnAI(page, '/');
  await page.locator('#composer').fill('We need a landing page for a coffee subscription: positioning, page structure and accessibility.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('details.contrib summary')).toContainText(/Who contributed \([2-4]\)/, { timeout: 30_000 });
});

test('studio fills content, renders it in an isolated sandbox, refines and downloads', async ({ page }) => {
  await turnOnAI(page, '/studio');
  await page.locator('textarea').first().fill('A calm booking page for a yoga studio with prices and a contact form.');
  await page.getByRole('button', { name: 'Generate' }).click();
  const frame = page.frameLocator('iframe[title^="Generated"]');
  await expect(frame.locator('h1')).toHaveText('Mock Page', { timeout: 20_000 });
  const storage = await frame.locator('body').evaluate(() => { try { return String(localStorage.length); } catch (e) { return (e as Error).name; } });
  expect(storage).toBe('SecurityError');
  await page.getByPlaceholder(/ocean palette/).fill('Use the ocean palette');
  await page.getByRole('button', { name: 'Apply change' }).click();
  await expect(frame.locator('h1')).toHaveText('Mock Page v2', { timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'v2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download .html' })).toBeEnabled();
  await page.getByRole('button', { name: 'Get the Claude Code prompt' }).click();
  await expect(page.locator('.prose pre')).toContainText('ROLE:');
});

test('no WebGPU: a clear message and a copy-the-prompt fallback', async ({ page }) => {
  await open(page, '/expert/ux-architect?nogpu=1');
  await expect(page.getByText("This device can't run the free AI.")).toBeVisible();
  await expect(page.getByRole('button', { name: "Copy this expert's prompt" })).toBeVisible();
});

test('privacy page explains the download and can delete models', async ({ page }) => {
  await turnOnAI(page, '/');
  await page.goto('/privacy');
  await expect(page.getByText(/Hugging Face/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Delete downloaded models' }).click();
  await expect(page.getByText('Downloaded models were deleted from this browser.')).toBeVisible();
});

test('no links to the GitHub repository while it is private', async ({ page }) => {
  const cfg = JSON.parse(readFileSync('studio.config.json', 'utf8'));
  test.skip(cfg.repoPublic !== false, 'repository is public');
  for (const path of ['/', '/resources', '/guide', '/privacy']) {
    await page.goto(path);
    await expect(page.locator('a[href*="github.com/jonathanwmartineza-collab"]')).toHaveCount(0);
  }
  await page.goto('/resources');
  await expect(page.getByText("The source code isn't public yet.")).toBeVisible();
});

test('library lists prompts', async ({ page }) => {
  await page.goto('/library');
  await expect(page.getByRole('heading', { name: 'Prompt Library' })).toBeVisible();
});

test('mobile drawer opens and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, '/expert/ux-architect');
  const btn = page.getByRole('button', { name: 'Open the list of experts' });
  await btn.click();
  await expect(page.locator('#sidebar')).toHaveAttribute('data-open', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sidebar')).toHaveAttribute('data-open', 'false');
  await expect(btn).toBeFocused();
});

for (const path of ['/', '/expert/edge-ai-engineer', '/studio', '/library', '/resources', '/guide', '/privacy']) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: no serious or critical issues on ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, path);
      await page.waitForTimeout(300);
      const res = await new AxeBuilder({ page: page as any }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
}

test('axe: a generated page passes in light and dark', async ({ page }) => {
  await turnOnAI(page, '/studio');
  await page.locator('textarea').first().fill('A calm booking page for a yoga studio with prices and a contact form.');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.frameLocator('iframe[title^="Generated"]').locator('h1')).toHaveText('Mock Page', { timeout: 20_000 });
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const res = await new AxeBuilder({ page: page as any }).include('iframe[title^="Generated"]').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${scheme} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  }
});

test('axe: every Studio block and palette passes in light and dark (rendered directly)', async ({ page }) => {
  const { renderPage } = await import('../../web/src/ai/studio/render');
  const { SpecSchema, KINDS, PALETTES } = await import('../../web/src/ai/studio/spec');
  const item = (n: number) => ({ title: `Item ${n}`, text: 'Useful text; Second point', meta: n === 1 ? '€15' : '9 am' });
  for (const palette of PALETTES) {
    const spec = SpecSchema.parse({ title: 'Test page', tagline: 'All blocks', palette, cta: 'Start', sections: KINDS.map((kind) => ({ kind, heading: `${kind} heading`, intro: 'Intro text', items: kind === 'contact' ? [] : [item(1), item(2), item(3)] })).slice(0, 8) });
    const spec2 = SpecSchema.parse({ ...spec, sections: KINDS.slice(8).map((kind) => ({ kind, heading: `${kind} heading`, items: kind === 'contact' ? [] : [item(1), item(2)] })) });
    for (const s of [spec, spec2]) {
      await page.setContent(renderPage(s));
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        const res = await new AxeBuilder({ page: page as any }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(bad.map((v) => `${palette} ${scheme} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      }
    }
  }
});
