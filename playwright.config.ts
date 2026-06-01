// playwright.config.ts
import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import { loadRegion } from './config/region';

const region = loadRegion();

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
        headless: true,
        trace: 'on-first-retry',
      },
    },
  ],
});
