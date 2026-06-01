// src/shared/helpers/dataFactory.ts
import type { TransactionCreatePayload, TransactionSplit } from '../types/firefly';

// These account names exist on the Firefly III demo instance by default.
// If running against a private instance, create matching accounts first.
const DEFAULT_SOURCE = 'Savings account';
const DEFAULT_DESTINATION = 'Groceries';

export function buildTransaction(overrides: Partial<TransactionSplit> = {}): TransactionCreatePayload {
  const today = new Date().toISOString().split('T')[0] as string;
  return {
    transactions: [
      {
        type: overrides.type ?? 'withdrawal',
        date: overrides.date ?? today,
        amount: overrides.amount ?? '10.00',
        description: overrides.description ?? `Test withdrawal ${Date.now()}`,
        source_name: overrides.source_name ?? DEFAULT_SOURCE,
        destination_name: overrides.destination_name ?? DEFAULT_DESTINATION,
      },
    ],
  };
}
