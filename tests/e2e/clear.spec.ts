import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Phones get "Lite" as the recommended model; the tests choose Quality the way a returning visitor would.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { if (!localStorage.getItem('ba2.tier')) localStorage.setItem('ba2.tier', 'quality'); } catch { /* storage blocked */ } }); });

// Clear options: "Clear" (one tool, with an 8-second Undo) and "Free up space" (everything, after confirmation).
test.skip(!!process.env.PW_BASE_URL, 'needs the mock engine (the live site runs the real model)');

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('aside .row').first()).toBeAttached();
}
async function turnOnAI(page: Page) {
  await page.getByRole('button', { name: /^(Download|Turn on AI) .*Quality/ }).click();
  await expect(page.locator('#composer, textarea').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('progressbar')).toHaveCount(0, { timeout: 10_000 });
}
async function ask(page: Page, q: string) {
  await page.locator('#composer').fill(q);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Reply complete' })).toHaveCount(1, { timeout: 15_000 });
}
const toast = (page: Page) => page.locator('.toast');

test('expert chat: Clear erases the chat, Undo restores it, and a new chat works afterwards', async ({ page }) => {
  await open(page, '/expert/ui-designer');
  await turnOnAI(page);
  await ask(page, 'Suggest a palette for a bakery');
  await page.getByRole('button', { name: 'Clear options' }).click();
  const panel = page.getByRole('region', { name: 'Clear options' });
  await expect(panel).toContainText('Erases this chat with Bastien Mwangi');
  await expect(panel).toContainText('Keeps the downloaded AI model');
  await panel.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('.msg')).toHaveCount(0);
  await expect(toast(page)).toContainText('Cleared this chat with Bastien Mwangi.');
  const undo = page.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeFocused(); // keyboard users can undo with Enter right away
  await page.keyboard.press('Enter');
  await expect(page.locator('.msg.user')).toContainText('bakery');
  await page.reload();
  await expect(page.locator('.msg.user')).toContainText('bakery'); // the restored chat is saved again

  // Clear again and let it become final: the toast closes by itself after about 8 seconds.
  await page.getByRole('button', { name: 'Clear options' }).click();
  await page.getByRole('region', { name: 'Clear options' }).getByRole('button', { name: 'Clear', exact: true }).click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(6_000);
  await expect(toast(page)).toBeVisible();
  await expect(toast(page)).toHaveCount(0, { timeout: 4_000 });
  await page.reload();
  await expect(page.locator('.msg')).toHaveCount(0);
  await turnOnAI(page); // model still downloaded: "Turn on AI", no new download
  await ask(page, 'A fresh idea: a tea shop');
  await expect(page.locator('.msg.ai .md').last()).toContainText('Bastien here (mock engine)');
});

test('expert chat: the red Clear chat button beside Send clears in one press, and Undo brings it all back', async ({ page }) => {
  await open(page, '/expert/ui-designer');
  await turnOnAI(page);
  const btn = page.locator('.composer .clear-btn');
  await expect(btn).toHaveCount(0); // nothing to clear yet
  await ask(page, 'Suggest a palette for a bakery');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAccessibleName('Clear chat');
  await expect(btn).toHaveText('Clear chat');
  const box = await btn.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await btn.click();
  await expect(page.locator('.msg')).toHaveCount(0);
  await expect(toast(page)).toContainText('Cleared this chat with Bastien Mwangi.');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.msg.user')).toContainText('bakery');
  await page.reload();
  await expect(page.locator('.msg.user')).toContainText('bakery'); // saved history came back too
});

test('team chat: Clear works from the keyboard alone', async ({ page }) => {
  await open(page, '/');
  await turnOnAI(page);
  await page.locator('#composer').fill('Landing page for a coffee subscription: positioning and accessibility.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('details.contrib summary')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Clear options' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Clear', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('details.contrib')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Get started in 3 steps' })).toBeVisible(); // ready for a new idea
  await page.keyboard.press('Escape'); // closes the toast: the clear is final
  await expect(toast(page)).toHaveCount(0);
  await page.reload();
  await expect(page.locator('details.contrib')).toHaveCount(0);
});

test('studio: Clear removes the page and brief, Undo brings them back, and Generate works afterwards', async ({ page }) => {
  await open(page, '/studio');
  await turnOnAI(page);
  await page.getByLabel('Your brief').fill('A calm booking page for a yoga studio with prices.');
  await page.getByRole('button', { name: 'Generate' }).click();
  const frame = page.frameLocator('iframe[title^="Generated"]');
  await expect(frame.locator('h1')).toHaveText('Mock Page', { timeout: 20_000 });
  await page.getByRole('button', { name: 'Clear options' }).click();
  await page.getByRole('region', { name: 'Clear options' }).getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByLabel('Your brief')).toHaveValue('');
  await expect(page.locator('iframe[title^="Generated"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByLabel('Your brief')).toHaveValue(/yoga studio/);
  await expect(frame.locator('h1')).toHaveText('Mock Page', { timeout: 10_000 });
  await page.reload();
  await expect(frame.locator('h1')).toHaveText('Mock Page', { timeout: 10_000 }); // restored page saved again

  await page.getByRole('button', { name: 'Clear options' }).click();
  await page.getByRole('region', { name: 'Clear options' }).getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByRole('button', { name: 'Close message' }).click();
  await page.reload();
  await expect(page.locator('iframe[title^="Generated"]')).toHaveCount(0);
  await page.getByLabel('Your brief').fill('A portfolio page for a ceramic artist.');
  await page.getByRole('button', { name: /Turn on AI|Generate/ }).first().click();
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(frame.locator('h1')).toHaveText('Mock Page', { timeout: 20_000 });
});

test('Free up space asks first, deletes everything except settings, and the app works normally afterwards', async ({ page }) => {
  await open(page, '/expert/ux-architect');
  const menu = page.getByRole('button', { name: 'Open the list of experts' });
  if (await menu.isVisible()) await menu.click(); // phones: the theme button lives in the menu
  await page.getByRole('button', { name: /Change theme/ }).click(); // theme → light: a setting that must survive
  if (await menu.isVisible()) await page.keyboard.press('Escape');
  await turnOnAI(page);
  await ask(page, 'Map the onboarding flow');
  await page.getByRole('button', { name: 'Clear options' }).click();
  const panel = page.getByRole('region', { name: 'Clear options' });
  await expect(panel).toContainText('the downloaded AI model, caches and temporary files');
  await expect(panel).toContainText('Keeps your theme and contrast settings');

  // Cancel changes nothing.
  await panel.getByRole('button', { name: 'Free up space…' }).click();
  const dlg = page.getByRole('dialog', { name: 'Free up space?' });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dlg.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.msg.user')).toContainText('onboarding');

  // Confirm deletes chats, pages and the model.
  await panel.getByRole('button', { name: 'Free up space…' }).click();
  await dlg.getByRole('button', { name: 'Delete and free up space' }).click();
  await expect(toast(page)).toContainText(/Freed .*|Space freed\./);
  await expect(toast(page)).toContainText('download again');
  await expect(page.locator('.msg')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download Quality model' })).toBeVisible(); // the model is gone
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light'); // settings kept
  const left = await page.evaluate(() => ({ chats: localStorage.getItem('ba2-chats-v1'), mock: Object.keys(localStorage).filter((k) => k.startsWith('mock.cached')).length }));
  expect(left).toEqual({ chats: null, mock: 0 });

  // Works normally again: download, ask, answer.
  await turnOnAI(page);
  await ask(page, 'Map the checkout flow');
  await expect(page.locator('.msg.ai .md').last()).toContainText('here (mock engine)');
  await page.goto('/studio');
  await expect(page.getByText('Your page will appear here.')).toBeVisible(); // Studio pages were deleted too
});

test('phone (390px): Clear options panel fits, buttons are 44px and the confirm dialog is usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/expert/ui-designer');
  await page.getByRole('button', { name: 'Clear options' }).click();
  const panel = page.getByRole('region', { name: 'Clear options' });
  await expect(panel).toBeInViewport();
  for (const b of await panel.getByRole('button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.getByRole('button', { name: 'Free up space…' }).click();
  const dlg = page.getByRole('dialog', { name: 'Free up space?' });
  const box = (await dlg.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clear options' })).toBeFocused();
});

for (const scheme of ['light', 'dark'] as const) for (const hc of [false, true]) {
  test(`axe: open Clear options panel and confirm dialog pass (${scheme}${hc ? ', high contrast' : ''})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    if (hc) await page.addInitScript(() => localStorage.setItem('ba2-contrast', 'high'));
    await open(page, '/studio');
    await page.getByRole('button', { name: 'Clear options' }).click();
    const scan = async (label: string) => {
      const r = await new AxeBuilder({ page: page as any }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${label} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    };
    await scan('panel');
    await page.getByRole('button', { name: 'Free up space…' }).click();
    await scan('dialog');
  });
}
