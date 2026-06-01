// src/web/pages/DashboardPage.ts
import type { Locator, Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export class DashboardPage {
  readonly pageHeading: Locator;
  readonly navBar: Locator;

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {
    this.pageHeading = page.locator('.content-header h1').first();
    this.navBar = page.locator('nav.navbar, #main-nav');
  }

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/home`);
    return this;
  }

  url(): string {
    return this.page.url();
  }
}
