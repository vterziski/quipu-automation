// playwright.config.ts
import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import type { RegionConfig } from './config/region';
import { loadRegion } from './config/region';

let region: RegionConfig;
try {
  region = loadRegion();
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  throw new Error(`Playwright config failed to load region: ${msg}\nCopy .env.example to .env and set API_TOKEN.`);
}

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  projects: [
    {
      name: 'api',
      testDir: './src/api/tests',
      use: {
        baseURL: region.apiBaseUrl,
      },
    },
    {
      name: 'web',
      testDir: './src/web/tests',
      use: {
        baseURL: region.webBaseUrl,
        browserName: 'chromium',
        headless: !process.env.HEADED, // run with HEADED=1 for a visible browser
        trace: 'on-first-retry',
      },
    },
  ],
});
