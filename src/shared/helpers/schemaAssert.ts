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

function assertStringFields(obj: Record<string, unknown>, fields: string[], basePath: string): void {
  for (const field of fields) {
    assertString(obj[field], `${basePath}.${field}`);
  }
}

function assertNumberFields(obj: Record<string, unknown>, fields: string[], basePath: string): void {
  for (const field of fields) {
    assertNumber(obj[field], `${basePath}.${field}`);
  }
}

export function assertTransactionListSchema(
  body: unknown,
): asserts body is TransactionListResponse {
  assertObject(body, 'root');

  if (!Array.isArray(body['data'])) {
    throw new Error(`Schema assertion failed: expected array at root.data`);
  }

  // Empty data[] is a valid API response (e.g. clean instance with no transactions);
  // item-shape assertions are skipped but pagination meta is still validated below.
  for (let i = 0; i < body['data'].length; i++) {
    const item = body['data'][i] as unknown;
    assertObject(item, `data[${i}]`);
    assertStringFields(item, ['id', 'type'], `data[${i}]`);
    assertObject(item['attributes'], `data[${i}].attributes`);

    const attrs = item['attributes'] as Record<string, unknown>;
    if (!Array.isArray(attrs['transactions']) || attrs['transactions'].length === 0) {
      throw new Error(`Schema assertion failed: expected non-empty array at data[${i}].attributes.transactions`);
    }

    const tx = attrs['transactions'][0] as unknown;
    assertObject(tx, `data[${i}].attributes.transactions[0]`);
    assertStringFields(
      tx as Record<string, unknown>,
      ['amount', 'description', 'date', 'source_name'],
      `data[${i}].attributes.transactions[0]`,
    );
  }

  assertObject(body['meta'], 'meta');
  assertObject(body['meta']['pagination'], 'meta.pagination');
  assertNumberFields(
    body['meta']['pagination'] as Record<string, unknown>,
    ['total', 'per_page', 'current_page'],
    'meta.pagination',
  );
}
