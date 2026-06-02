// src/shared/helpers/amounts.ts

/**
 * Parses a Firefly III monetary amount string to a number for comparison.
 * The API returns full precision (e.g. "10.000000000000"); this normalises it.
 */
export function parseAmount(value: string): number {
  return parseFloat(value);
}
