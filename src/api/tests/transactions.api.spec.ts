// src/api/tests/transactions.api.spec.ts
import { test, expect } from '../fixtures/api.fixtures';
import { buildTransaction } from '../../shared/helpers/dataFactory';
import { assertTransactionListSchema } from '../../shared/helpers/schemaAssert';
import { parseAmount } from '../../shared/helpers/amounts';
import type { TransactionCreateResponse, ApiErrorResponse } from '../../shared/types/firefly';

test.describe('Transactions API', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ apiClient }) => {
    for (const id of createdIds) {
      // Swallow errors — cleanup failure must not mask the original test result
      await apiClient.deleteTransaction(id).catch(() => {});
    }
    createdIds.length = 0;
  });

  test('given valid payload when POST /transactions then HTTP 200 and body matches', async ({ apiClient }) => {
    const payload = buildTransaction({ description: 'happy-path-test' });

    const response = await apiClient.createTransaction(payload);

    // Firefly III returns 200 (not 201) for resource creation — this is a known API quirk
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('json');

    const body = await response.json() as TransactionCreateResponse;
    expect(body.data.id).toBeDefined();
    expect(parseAmount(body.data.attributes.transactions[0].amount)).toBe(parseAmount(payload.transactions[0].amount));
    expect(body.data.attributes.transactions[0].description).toBe(payload.transactions[0].description);

    createdIds.push(body.data.id);
  });

  test('given empty transactions array when POST /transactions then HTTP 422 with error details', async ({ apiClient }) => {
    const response = await apiClient.createTransaction({ transactions: [] });

    expect(response.status()).toBe(422);

    const body = await response.json() as ApiErrorResponse;
    // message field is always present; errors contains per-field validation details
    expect(body.message).toBeDefined();
    expect(body.errors).toBeDefined();
    // Must be a specific validation error, not a generic 500
    expect(response.status()).not.toBe(500);
  });

  test('given withdrawal list request when GET /transactions then HTTP 200 and schema is valid', async ({ apiClient }) => {
    const response = await apiClient.getTransactions({ type: 'withdrawal', limit: 5 });

    expect(response.status()).toBe(200);

    const body: unknown = await response.json();
    // assertTransactionListSchema throws with a descriptive message if shape is wrong
    assertTransactionListSchema(body);

    expect(body.meta.pagination.total).toBeGreaterThanOrEqual(0);
    expect(body.meta.pagination.per_page).toBeGreaterThanOrEqual(1);
    expect(body.meta.pagination.per_page).toBeLessThanOrEqual(5);
    expect(body.meta.pagination.current_page).toBe(1);
  });

  test('given identical payload when POST /transactions twice then both return 200 with different ids', async ({ apiClient }) => {
    // Firefly III does not enforce idempotency keys — each POST creates a separate transaction.
    // A production-grade API should return 409 or honour an Idempotency-Key header.
    // This test pins the current observed behaviour so regressions are detectable.
    const payload = buildTransaction({ description: 'idempotency-pin-test' });

    const response1 = await apiClient.createTransaction(payload);
    const response2 = await apiClient.createTransaction(payload);

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const body1 = await response1.json() as TransactionCreateResponse;
    const body2 = await response2.json() as TransactionCreateResponse;

    expect(body1.data.id).not.toBe(body2.data.id);

    createdIds.push(body1.data.id, body2.data.id);
  });
});
