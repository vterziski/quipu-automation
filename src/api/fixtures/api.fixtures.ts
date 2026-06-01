// src/api/fixtures/api.fixtures.ts
import { test as base } from '@playwright/test';
import { FireflyClient } from '../client/FireflyClient';
import { loadRegion } from '../../../config/region';

type ApiFixtures = {
  apiClient: FireflyClient;
};

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    const region = loadRegion();
    await use(new FireflyClient(request, region));
  },
});

export { expect } from '@playwright/test';
