import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('aside .row').first()).toBeAttached(); // the team has loaded; no welcome dialog blocks the page
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

const OWNER = 'Jonathan Martinez';
const ROLE = 'AI Practitioner';
const COPYRIGHT = '© 2026 Jonathan Martinez. All rights reserved.';

test('privacy: only the logo name and the copyright line are personal; no repo links, emails or credits', async ({ page }) => {
  for (const path of ['/', '/expert/edge-ai-engineer', '/studio', '/library', '/resources', '/guide', '/privacy', '/no-such-page']) {
    await open(page, path);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') || ''));
    expect(hrefs.filter((h) => /github\.com|gitlab\.com|bitbucket\.org|sourceforge\.net|codeberg\.org|^mailto:/i.test(h)), path).toEqual([]);
    await expect(page.locator('.owner')).toHaveCount(1);
    await expect(page.locator('.owner-name')).toHaveText(OWNER);
    await expect(page.locator('.owner-role')).toHaveText(ROLE);
    await expect(page.locator('.site-foot')).toHaveText(COPYRIGHT);
    const rest = await page.evaluate(() => { const c = document.body.cloneNode(true) as HTMLElement; c.querySelectorAll('.owner, .site-foot').forEach((e) => e.remove()); return c.innerText; });
    expect(rest, path).not.toMatch(/jonathan|martinez|practitioner|@[a-z0-9-]+\.[a-z]{2,}|outlook|gmail|source code|view source|made by|built with claude|layout inspired|©|copyright|rights reserved|for (my )?(students|instructors|teachers)/i);
  }
  const head = await page.locator('head').innerHTML();
  expect(head).not.toMatch(/github\.com|name="author"|jonathan|martinez|outlook|gmail/i); // raw.githubusercontent.com in the CSP is the model download host
});

test('static 404 page carries the same logo and copyright line', async ({ request }) => {
  const html = await (await request.get('/404.html')).text();
  expect(html).toContain(`<b>${OWNER}</b>`);
  expect(html).toContain(ROLE);
  expect(html).toContain(COPYRIGHT);
  expect(html).not.toMatch(/github\.com|mailto:|outlook|gmail/i);
});

for (const [w, h] of [[340, 700], [390, 844], [1440, 900]] as const) {
  test(`logo and footer: readable, top-left and unclipped at ${w}px in light, dark and high contrast`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const scheme of ['light', 'dark'] as const) for (const hc of [false, true]) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((on) => { try { if (on) localStorage.setItem('ba2-contrast', 'high'); else localStorage.removeItem('ba2-contrast'); } catch { /* storage blocked */ } }, hc);
      await open(page, '/studio');
      const logo = page.getByRole('link', { name: `${OWNER} ${ROLE}` });
      await expect(logo).toBeVisible();
      const box = (await logo.boundingBox())!;
      expect(box.x).toBeLessThan(w <= 860 ? 80 : 40); // after the menu button on phones
      expect(box.y).toBeLessThan(30);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await expect(page.locator('.owner-mark')).toBeVisible();
      if (w < 360) {
        await expect(page.locator('.owner-name')).not.toBeInViewport(); // the mark alone; the name stays as the link's accessible name
      } else {
        const name = page.locator('.owner-name');
        expect(await name.evaluate((e) => e.scrollWidth <= e.clientWidth + 1 && parseFloat(getComputedStyle(e).fontSize) >= 14)).toBe(true);
        const nb = (await name.boundingBox())!; expect(nb.x + nb.width).toBeLessThanOrEqual(w);
      }
      const foot = page.locator('.site-foot');
      await expect(foot).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test('first-time visitor reaches an answer in 3 steps: download, pick an example, send', async ({ page }) => {
  await open(page, '/');
  await expect(page.getByRole('list', { name: 'Get started in 3 steps' })).toBeVisible();
  await page.getByRole('button', { name: /^Download Balanced model/ }).click(); // step 1
  await expect(page.locator('#composer')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /landing page for a coffee subscription/ }).click(); // step 2
  await page.getByRole('button', { name: 'Send' }).click(); // step 3
  await expect(page.locator('details.contrib summary')).toContainText(/Who contributed/, { timeout: 30_000 });
});

test('high contrast mode turns on, persists across reloads and turns off', async ({ page }) => {
  await open(page, '/');
  const btn = page.getByRole('button', { name: 'High contrast' });
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await page.getByRole('button', { name: 'High contrast' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-contrast', 'high');
});

for (const width of [390, 1440]) {
  test(`every button is at least 44px tall and nothing scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/expert/ui-designer', '/studio', '/library', '/privacy']) {
      await open(page, path);
      const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button, .btn, select, input[type=search]')]
        .filter((e) => !e.classList.contains('link-btn') && !(innerWidth <= 860 && e.closest('#sidebar'))) // the phone drawer is checked when open
        .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30), h: e.getBoundingClientRect().height }))
        .filter((x) => x.h > 0 && x.h < 44));
      expect(small, path).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    }
  });
}

test('phone: the Studio brief and the model picker are reachable, and chat examples are not squashed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/studio');
  const brief = page.getByLabel('Your brief');
  await brief.scrollIntoViewIfNeeded();
  await expect(brief).toBeInViewport();
  await page.getByRole('button', { name: /^Download Balanced model/ }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: /^Download Balanced model/ })).toBeInViewport();
  await open(page, '/expert/ui-designer');
  const first = page.locator('.chip-btn').first();
  expect((await first.boundingBox())!.height).toBeGreaterThan(40);
  await expect(first).toBeInViewport();
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
