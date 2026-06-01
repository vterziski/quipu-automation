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
  private readonly submitButton: Locator;
  readonly validationError: Locator;

  constructor(
    private readonly page: Page,
    private readonly region: RegionConfig,
  ) {
    this.descriptionInput = page.locator('input[name="description"]').first();
    this.amountInput = page.locator('input[name="amount"]').first();
    this.dateInput = page.locator('input[name="date"]').first();
    this.sourceDropdown = page.locator('input[name="source_name"]').first();
    this.destinationDropdown = page.locator('input[name="destination_name"]').first();
    this.submitButton = page.locator('button[type="submit"]').first();
    this.validationError = page.locator('.has-error, .invalid-feedback, .text-danger');
  }

  async goto(): Promise<this> {
    await this.page.goto(`${this.region.webBaseUrl}/transactions/create/withdrawal`);
    return this;
  }

  private async fillAutocomplete(input: Locator, value: string): Promise<void> {
    await input.fill(value);
    // Select from the Vue autocomplete dropdown if it appears; fall back to keyboard Enter
    const suggestion = this.page.locator('.multiselect__option, .autocomplete-option', { hasText: value }).first();
    const hasSuggestion = await suggestion.isVisible().catch(() => false);
    if (hasSuggestion) {
      await suggestion.click();
    } else {
      await input.press('Enter');
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
    await this.submitButton.click();
  }
}
