// src/web/tests/transaction.web.spec.ts
import { test, expect } from '../fixtures/web.fixtures';
import { loadRegion } from '../../../config/region';
import { buildTransaction } from '../../shared/helpers/dataFactory';
import type { TransactionListResponse } from '../../shared/types/firefly';

test.describe('Transaction creation', () => {
  const createdIds: string[] = [];

  test.beforeEach(async ({ loginPage }) => {
    const { defaultUser } = loadRegion();
    await loginPage.goto();
    await loginPage.login(defaultUser.email, defaultUser.password);
  });

  test.afterEach(async ({ apiClient }) => {
    for (const id of createdIds) {
      await apiClient.deleteTransaction(id).catch(() => {});
    }
    createdIds.length = 0;
  });

  test('given authenticated user when creating transaction via UI then API confirms newest transaction matches', async ({
    transactionCreatePage,
    transactionListPage,
    apiClient,
  }) => {
    const seed = buildTransaction({ description: `ui-create-${Date.now()}` });
    const tx = seed.transactions[0];

    await transactionCreatePage.goto();
    await transactionCreatePage.fill({
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      sourceName: tx.source_name,
      destinationName: tx.destination_name,
    });
    await transactionCreatePage.submit();

    // After successful creation, Firefly III redirects to the transaction list
    await expect(transactionListPage.successMessage).toBeVisible();

    const listResponse = await apiClient.getTransactions({ type: 'withdrawal', limit: 1 });
    expect(listResponse.status()).toBe(200);

    const listBody = await listResponse.json() as TransactionListResponse;
    const newestTx = listBody.data[0].attributes.transactions[0];
    expect(newestTx.description).toBe(tx.description);
    expect(newestTx.amount).toBe(tx.amount);

    createdIds.push(listBody.data[0].id);
  });

  test('given empty amount field when submitting transaction form then inline validation error is shown', async ({
    transactionCreatePage,
    page,
  }) => {
    const { webBaseUrl } = loadRegion();

    await transactionCreatePage.goto();
    await transactionCreatePage.fill({
      description: 'validation-test',
      amount: '',
      date: new Date().toISOString().split('T')[0] as string,
      sourceName: 'Savings account',
      destinationName: 'Groceries',
    });
    await transactionCreatePage.submit();

    await expect(transactionCreatePage.validationError).toBeVisible();
    // URL stays on the create page — no redirect
    expect(page.url()).toContain('/transactions/create');
    // Form remains interactive
    await expect(page.locator('input[name="description"]').first()).toBeEnabled();
  });
});
