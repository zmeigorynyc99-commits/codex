import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { randomInt, randomInts } from '@/lib/tools-logic/random';
import { generatePassword, estimateStrength } from '@/lib/tools-logic/password';
import { normalizeToMs, describeTimestamp, dateStringToUnix } from '@/lib/tools-logic/unix-time';
import { countdownTo, businessDaysBetween } from '@/lib/tools-logic/countdown';

beforeAll(() => {
  // Ensure Web Crypto is available in the Node test environment.
  if (typeof globalThis.crypto === 'undefined') {
    // @ts-expect-error assign Node's webcrypto to the global
    globalThis.crypto = webcrypto;
  }
});

describe('random', () => {
  it('produces integers within range', () => {
    for (let i = 0; i < 200; i += 1) {
      const n = randomInt(1, 6);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('returns unique values when requested', () => {
    const values = randomInts(1, 49, 6, true);
    expect(values).toHaveLength(6);
    expect(new Set(values).size).toBe(6);
  });

  it('caps unique count to range size', () => {
    expect(randomInts(1, 3, 10, true)).toHaveLength(3);
  });
});

describe('password', () => {
  it('generates a password of the requested length', () => {
    const pw = generatePassword({
      length: 20,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    });
    expect(pw).toHaveLength(20);
  });

  it('throws when no character set is selected', () => {
    expect(() =>
      generatePassword({
        length: 10,
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
        excludeAmbiguous: false,
      }),
    ).toThrow();
  });

  it('estimates higher entropy for longer, varied passwords', () => {
    const weak = estimateStrength('aaa');
    const strong = estimateStrength('aB3$kL9@mN2#pQ7&');
    expect(strong.bits).toBeGreaterThan(weak.bits);
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe('unix time', () => {
  it('detects seconds vs milliseconds', () => {
    expect(normalizeToMs(1700000000)).toBe(1700000000000);
    expect(normalizeToMs(1700000000000)).toBe(1700000000000);
  });

  it('describes a timestamp in UTC', () => {
    const b = describeTimestamp(1700000000)!;
    expect(b.iso).toBe('2023-11-14T22:13:20.000Z');
    expect(b.seconds).toBe(1700000000);
  });

  it('parses a date string to unix seconds', () => {
    expect(dateStringToUnix('2023-11-14T22:13:20Z')).toBe(1700000000);
    expect(dateStringToUnix('not a date')).toBeNull();
  });
});

describe('countdown', () => {
  it('computes remaining time', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-01-02T01:02:03Z');
    const cd = countdownTo(to, from)!;
    expect(cd.past).toBe(false);
    expect(cd.days).toBe(1);
    expect(cd.hours).toBe(1);
    expect(cd.minutes).toBe(2);
    expect(cd.seconds).toBe(3);
  });

  it('flags past dates', () => {
    const cd = countdownTo(new Date('2020-01-01'), new Date('2026-01-01'))!;
    expect(cd.past).toBe(true);
  });

  it('counts business days', () => {
    // Mon 2026-06-15 to Mon 2026-06-22 => 5 weekdays.
    expect(businessDaysBetween(new Date('2026-06-15'), new Date('2026-06-22'))).toBe(5);
  });
});
