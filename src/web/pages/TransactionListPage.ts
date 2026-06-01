// src/web/pages/TransactionListPage.ts
import type { Locator, Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export class TransactionListPage {
  readonly firstRow: Locator;

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {
    this.firstRow = page.locator('table tbody tr').first();
  }

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/transactions/index/withdrawal`);
    return this;
  }
}
