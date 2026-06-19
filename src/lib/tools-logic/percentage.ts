/** Percentage calculation helpers. All functions are pure and side-effect free. */

/** What is `percent`% of `value`? e.g. 20% of 80 = 16. */
export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

/** `part` is what percent of `total`? e.g. 16 is 20% of 80. */
export function whatPercent(part: number, total: number): number {
  if (total === 0) return NaN;
  return (part / total) * 100;
}

/** Percentage change from `from` to `to`. Positive = increase. */
export function percentChange(from: number, to: number): number {
  if (from === 0) return NaN;
  return ((to - from) / Math.abs(from)) * 100;
}

/** Add `percent`% to `value`. e.g. 80 + 20% = 96. */
export function addPercent(value: number, percent: number): number {
  return value + percentOf(percent, value);
}

/** Subtract `percent`% from `value`. e.g. 80 - 20% = 64. */
export function subtractPercent(value: number, percent: number): number {
  return value - percentOf(percent, value);
}
