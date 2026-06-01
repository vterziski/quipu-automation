// src/web/pages/DashboardPage.ts
import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly pageHeading: Locator;
  readonly navBar: Locator;

  constructor(private readonly page: Page) {
    this.pageHeading = page.locator('h1, .breadcrumb-item.active').first();
    this.navBar = page.locator('nav.navbar, #main-nav');
  }

  isAt(): Promise<boolean> {
    return this.navBar.isVisible();
  }

  url(): string {
    return this.page.url();
  }
}
