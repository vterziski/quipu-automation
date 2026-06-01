// src/web/pages/LoginPage.ts
import type { Locator, Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export class LoginPage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"], input[type="submit"]');
    this.errorAlert = page.locator('.alert-danger, .alert.alert-danger');
  }

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/login`);
    return this;
  }

  async fillCredentials(email: string, password: string): Promise<this> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    return this;
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }
}
