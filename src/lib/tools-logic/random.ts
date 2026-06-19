/** Cryptographically-strong random integers using the Web Crypto API. */

/** Returns a uniformly distributed random integer in [min, max] (inclusive). */
export function randomInt(min: number, max: number): number {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  const range = hi - lo + 1;
  if (range <= 0) return lo;

  // Rejection sampling to avoid modulo bias.
  const maxUint32 = 0xffffffff;
  const limit = Math.floor((maxUint32 + 1) / range) * range;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    cryptoRef().getRandomValues(buffer);
    value = buffer[0]!;
  } while (value >= limit);
  return lo + (value % range);
}

/** Returns `count` random integers in [min, max], optionally without repeats. */
export function randomInts(min: number, max: number, count: number, unique = false): number[] {
  const safeCount = Math.max(0, Math.floor(count));
  if (!unique) {
    return Array.from({ length: safeCount }, () => randomInt(min, max));
  }
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  const poolSize = hi - lo + 1;
  const take = Math.min(safeCount, poolSize);
  const pool = Array.from({ length: poolSize }, (_, i) => lo + i);
  // Partial Fisher–Yates shuffle.
  for (let i = 0; i < take; i += 1) {
    const j = i + randomInt(0, poolSize - 1 - i);
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, take);
}

function cryptoRef(): Crypto {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API is not available in this environment.');
}
