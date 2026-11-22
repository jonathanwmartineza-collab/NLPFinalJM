import { defineConfig } from '@playwright/test';
// Uses a preinstalled Chrome (CHROME_PATH) when available. The site is built with the mock engine
// (VITE_MOCK_ENGINE=1) so every flow can be tested without a GPU or a model download.
const executablePath = process.env.CHROME_PATH || undefined;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  use: { baseURL: 'http://localhost:8899', launchOptions: { executablePath }, trace: 'off' },
  webServer: {
    command: 'npx vite build --config web/vite.config.ts --outDir dist-test --logLevel error && npx vite preview --config web/vite.config.ts --outDir dist-test --port 8899 --strictPort',
    env: { VITE_MOCK_ENGINE: '1' },
    url: 'http://localhost:8899/', reuseExistingServer: false, timeout: 90_000,
  },
});
