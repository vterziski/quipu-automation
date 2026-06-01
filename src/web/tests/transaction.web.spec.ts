// src/web/tests/transaction.web.spec.ts
import { test, expect } from '../fixtures/web.fixtures';
import { buildTransaction } from '../../shared/helpers/dataFactory';
import type { TransactionListResponse } from '../../shared/types/firefly';

test.describe('Transaction creation', () => {
  const createdIds: string[] = [];

  test.beforeEach(async ({ loginPage, region }) => {
    await loginPage.goto();
    await loginPage.login(region.defaultUser.email, region.defaultUser.password);
  });

  test.afterEach(async ({ apiClient }) => {
    for (const id of createdIds) {
      // Swallow errors — cleanup failure must not mask the original test result
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

    const listResponse = await apiClient.getTransactions({ type: 'withdrawal', limit: 10 });
    expect(listResponse.status()).toBe(200);

    const listBody = await listResponse.json() as TransactionListResponse;
    const matchingEntry = listBody.data.find(
      (entry) => entry.attributes.transactions[0]?.description === tx.description,
    );
    expect(matchingEntry).toBeDefined();
    if (!matchingEntry) throw new Error('Transaction not found in API response');
    const newestTx = matchingEntry.attributes.transactions[0];
    expect(newestTx.description).toBe(tx.description);
    expect(newestTx.amount).toBe(tx.amount);

    createdIds.push(matchingEntry.id);
  });

  test('given empty amount field when submitting transaction form then inline validation error is shown', async ({
    transactionCreatePage,
    page,
  }) => {
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
