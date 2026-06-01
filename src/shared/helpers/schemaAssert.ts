// src/shared/helpers/schemaAssert.ts
import type { TransactionListResponse } from '../types/firefly';

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Schema assertion failed: expected string at ${path}, got ${typeof value}`);
  }
}

function assertNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Schema assertion failed: expected number at ${path}, got ${typeof value}`);
  }
}

function assertObject(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Schema assertion failed: expected object at ${path}, got ${typeof value}`);
  }
}

export function assertTransactionListSchema(
  body: unknown,
): asserts body is TransactionListResponse {
  assertObject(body, 'root');

  if (!Array.isArray(body['data'])) {
    throw new Error(`Schema assertion failed: expected array at root.data`);
  }

  if (body['data'].length === 0) {
    throw new Error(`Schema assertion failed: expected non-empty array at root.data`);
  }

  for (let i = 0; i < body['data'].length; i++) {
    const item = body['data'][i] as unknown;
    assertObject(item, `data[${i}]`);
    assertString(item['id'], `data[${i}].id`);
    assertString(item['type'], `data[${i}].type`);
    assertObject(item['attributes'], `data[${i}].attributes`);

    const attrs = item['attributes'] as Record<string, unknown>;
    if (!Array.isArray(attrs['transactions']) || attrs['transactions'].length === 0) {
      throw new Error(`Schema assertion failed: expected non-empty array at data[${i}].attributes.transactions`);
    }

    const tx = attrs['transactions'][0] as unknown;
    assertObject(tx, `data[${i}].attributes.transactions[0]`);
    assertString(tx['amount'], `data[${i}].attributes.transactions[0].amount`);
    assertString(tx['description'], `data[${i}].attributes.transactions[0].description`);
    assertString(tx['date'], `data[${i}].attributes.transactions[0].date`);
    assertString(tx['source_name'], `data[${i}].attributes.transactions[0].source_name`);
  }

  assertObject(body['meta'], 'meta');
  assertObject(body['meta']['pagination'], 'meta.pagination');
  assertNumber(body['meta']['pagination']['total'], 'meta.pagination.total');
  assertNumber(body['meta']['pagination']['per_page'], 'meta.pagination.per_page');
  assertNumber(body['meta']['pagination']['current_page'], 'meta.pagination.current_page');
}
