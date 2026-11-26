import { defineConfig } from '@playwright/test';
// Uses a preinstalled Chrome (CHROME_PATH) when available. The site is built with the mock engine
// (VITE_MOCK_ENGINE=1) so every flow can be tested without a GPU or a model download.
import fs from 'node:fs';
const executablePath = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find((p) => fs.existsSync(p)) || undefined;
// PW_BASE_URL=https://brainyapp2.netlify.app runs the suite against a deployed site (tests that need the
// mock engine skip themselves there).
const live = process.env.PW_BASE_URL;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  use: { baseURL: live || 'http://localhost:8899', launchOptions: { executablePath }, trace: 'off' },
  webServer: live ? undefined : {
    command: 'npx vite build --config web/vite.config.ts --outDir dist-test --logLevel error && npx vite preview --config web/vite.config.ts --outDir dist-test --port 8899 --strictPort',
    env: { VITE_MOCK_ENGINE: '1' },
    url: 'http://localhost:8899/', reuseExistingServer: false, timeout: 90_000,
  },
});
