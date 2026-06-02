// src/web/tests/transaction.web.spec.ts
import { test, expect } from '../fixtures/web.fixtures';
import { buildTransaction } from '../../shared/helpers/dataFactory';
import { parseAmount } from '../../shared/helpers/amounts';
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

    // Fetch transaction count before the UI action (spec requirement: cross-layer baseline)
    const beforeResponse = await apiClient.getTransactions({ type: 'withdrawal' });
    expect(beforeResponse.status()).toBe(200);
    const beforeBody = await beforeResponse.json() as TransactionListResponse;
    const countBefore = beforeBody.meta.pagination.total;

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
    expect(listBody.meta.pagination.total).toBe(countBefore + 1);
    const matchingEntry = listBody.data.find(
      (entry) => entry.attributes.transactions[0]?.description === tx.description,
    );
    expect(matchingEntry).toBeDefined();
    if (!matchingEntry) throw new Error('Transaction not found in API response');
    const newestTx = matchingEntry.attributes.transactions[0];
    expect(newestTx.description).toBe(tx.description);
    expect(parseAmount(newestTx.amount)).toBe(parseAmount(tx.amount));

    createdIds.push(matchingEntry.id);
  });

  test('given empty amount field when submitting transaction form then inline validation error is shown', async ({
    transactionCreatePage,
    page,
  }) => {
    const seed = buildTransaction();
    const tx = seed.transactions[0];
    await transactionCreatePage.goto();
    await transactionCreatePage.fill({
      description: tx.description,
      amount: '',  // intentionally empty to trigger validation
      date: tx.date,
      sourceName: tx.source_name,
      destinationName: tx.destination_name,
    });

    await transactionCreatePage.submit();

    // Firefly III shows a server-side validation error and stays on the create page
    await expect(transactionCreatePage.validationError).toBeVisible();
    expect(page.url()).toContain('/transactions/create');
    // Form remains interactive after validation failure
    await expect(page.locator('input[name="description[]"]').first()).toBeEnabled();
  });
});
