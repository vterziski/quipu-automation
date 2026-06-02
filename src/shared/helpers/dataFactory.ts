// src/shared/helpers/dataFactory.ts
import type { TransactionCreatePayload, TransactionSplit } from '../types/firefly';

// These account names exist on the Firefly III demo instance by default.
// If running against a private instance, create matching accounts first.
const DEFAULT_SOURCE = 'Savings account';
const DEFAULT_DESTINATION = 'Groceries';

export function buildTransaction(overrides: Partial<TransactionSplit> = {}): TransactionCreatePayload {
  // datetime-local inputs require "YYYY-MM-DDTHH:MM"; API accepts both formats
  const today = new Date().toISOString().slice(0, 16);
  return {
    transactions: [
      {
        type: 'withdrawal',
        date: today,
        amount: '10.00',
        description: `Test withdrawal ${Date.now()}`,
        source_name: DEFAULT_SOURCE,
        destination_name: DEFAULT_DESTINATION,
        ...overrides,
      },
    ],
  };
}
