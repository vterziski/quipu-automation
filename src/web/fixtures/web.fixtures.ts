// src/web/fixtures/web.fixtures.ts
import { test as base } from '@playwright/test';
import { loadRegion } from '../../../config/region';
import type { RegionConfig } from '../../../config/region';
import { FireflyClient } from '../../api/client/FireflyClient';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionCreatePage } from '../pages/TransactionCreatePage';
import { TransactionListPage } from '../pages/TransactionListPage';

type WebFixtures = {
  region: RegionConfig;
  apiClient: FireflyClient;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  transactionCreatePage: TransactionCreatePage;
  transactionListPage: TransactionListPage;
};

export const test = base.extend<WebFixtures>({
  region: async ({}, use) => {
    await use(loadRegion());
  },
  apiClient: async ({ request, region }, use) => {
    await use(new FireflyClient(request, region));
  },
  loginPage: async ({ page, region }, use) => {
    await use(new LoginPage(page, region));
  },
  dashboardPage: async ({ page, region }, use) => {
    await use(new DashboardPage(page, region));
  },
  transactionCreatePage: async ({ page, region }, use) => {
    await use(new TransactionCreatePage(page, region));
  },
  transactionListPage: async ({ page, region }, use) => {
    await use(new TransactionListPage(page, region));
  },
});

export { expect } from '@playwright/test';
