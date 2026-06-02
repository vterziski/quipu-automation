// src/shared/helpers/amounts.ts

/**
 * Parses a Firefly III monetary amount string for comparison.
 * Normalises to 2 decimal places so "10.000000000000" equals "10.00".
 */
export function parseAmount(value: string): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid amount value: "${value}"`);
  }
  return Math.round(n * 100) / 100;
}
