// src/web/pages/TransactionCreatePage.ts
import type { Locator, Page } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';

export interface TransactionFormData {
  description: string;
  amount: string;
  date: string;
  sourceName: string;
  destinationName: string;
}

export class TransactionCreatePage {
  private readonly descriptionInput: Locator;
  private readonly amountInput: Locator;
  private readonly dateInput: Locator;
  private readonly sourceDropdown: Locator;
  private readonly destinationDropdown: Locator;
  readonly submitButton: Locator;
  readonly validationError: Locator;

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {
    this.descriptionInput = page.locator('input[name="description[]"]').first();
    this.amountInput = page.locator('input[name="amount[]"]').first();
    this.dateInput = page.locator('input[name="date[]"]').first();
    this.sourceDropdown = page.locator('input[name="source[]"]').first();
    this.destinationDropdown = page.locator('input[name="destination[]"]').first();
    // Target the form's green Submit button specifically, not the navbar search button
    this.submitButton = page.locator('button[type="submit"].btn-success, #submitButton').first();
    this.validationError = page.locator('.has-error, .invalid-feedback, .text-danger').first();
  }

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/transactions/create/withdrawal`);
    await this.dismissIntro();
    return this;
  }

  async dismissIntro(): Promise<void> {
    // Use partial class match so upgrades from intro.js to another tour library still work
    const overlay = this.page.locator('[class*="introjs-overlay"], [class*="shepherd-overlay"]');
    if (await overlay.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.page.keyboard.press('Escape');
      // String form avoids DOM lib requirement in tsconfig
      await this.page.evaluate(`document.querySelectorAll('[class*="introjs-"],[class*="shepherd-"]').forEach(el=>el.remove())`);
    }
  }

  private async fillAutocomplete(input: Locator, value: string): Promise<void> {
    await input.fill(value);
    // \s* allows for leading whitespace that autocomplete libraries may prepend to <li> text
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suggestion = this.page.locator('li').filter({ hasText: new RegExp(`^\\s*${escaped}`) }).first();
    // Event-driven wait — no hardcoded timeout
    let appeared = false;
    try {
      await suggestion.waitFor({ state: 'visible', timeout: 3000 });
      appeared = true;
    } catch {
      appeared = false;
    }
    if (appeared) {
      await suggestion.click();
    } else {
      await input.press('Tab');
    }
  }

  async fill(data: TransactionFormData): Promise<this> {
    await this.descriptionInput.fill(data.description);
    await this.amountInput.fill(data.amount);
    await this.dateInput.fill(data.date);
    await this.fillAutocomplete(this.sourceDropdown, data.sourceName);
    await this.fillAutocomplete(this.destinationDropdown, data.destinationName);
    return this;
  }

  async submit(): Promise<void> {
    await this.dismissIntro();
    await this.submitButton.click();
  }
}
