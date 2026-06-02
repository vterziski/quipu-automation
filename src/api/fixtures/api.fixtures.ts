// src/api/fixtures/api.fixtures.ts
import { test as base } from '@playwright/test';
import { FireflyClient } from '../client/FireflyClient';
import { loadRegion } from '../../../config/region';
import type { RegionConfig } from '../../../config/region';

type ApiFixtures = {
  region: RegionConfig;
  apiClient: FireflyClient;
  createdIds: string[];
};

export const test = base.extend<ApiFixtures>({
  region: async ({}, use) => {
    await use(loadRegion());
  },
  apiClient: async ({ request, region }, use) => {
    await use(new FireflyClient(request, region));
  },
  createdIds: async ({ apiClient }, use) => {
    const ids: string[] = [];
    await use(ids);
    for (const id of ids) {
      await apiClient.deleteTransaction(id).catch(() => {});
    }
  },
});

export { expect } from '@playwright/test';
