// src/web/fixtures/web.fixtures.ts
import { test as base } from '@playwright/test';
import { loadRegion } from '../../../config/region';
import { FireflyClient } from '../../api/client/FireflyClient';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionCreatePage } from '../pages/TransactionCreatePage';
import { TransactionListPage } from '../pages/TransactionListPage';

type WebFixtures = {
  apiClient: FireflyClient;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  transactionCreatePage: TransactionCreatePage;
  transactionListPage: TransactionListPage;
};

export const test = base.extend<WebFixtures>({
  apiClient: async ({ request }, use) => {
    const region = loadRegion();
    await use(new FireflyClient(request, region));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page, loadRegion()));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page, loadRegion()));
  },
  transactionCreatePage: async ({ page }, use) => {
    await use(new TransactionCreatePage(page, loadRegion()));
  },
  transactionListPage: async ({ page }, use) => {
    await use(new TransactionListPage(page, loadRegion()));
  },
});

export { expect } from '@playwright/test';
