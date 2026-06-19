import { describe, it, expect } from 'vitest';
import { calculateAge, nextBirthday } from '@/lib/tools-logic/age';
import { dateDifference, addDays } from '@/lib/tools-logic/date-diff';

describe('calculateAge', () => {
  it('computes exact age in years, months and days', () => {
    const result = calculateAge(new Date('1990-06-15'), new Date('2026-06-19'));
    expect(result).not.toBeNull();
    expect(result!.years).toBe(36);
    expect(result!.months).toBe(0);
    expect(result!.days).toBe(4);
  });

  it('borrows correctly across month boundaries', () => {
    const result = calculateAge(new Date('2000-01-31'), new Date('2000-03-01'));
    expect(result!.years).toBe(0);
    expect(result!.months).toBe(1);
  });

  it('handles a leap-year birthday', () => {
    const result = calculateAge(new Date('2000-02-29'), new Date('2001-02-28'));
    expect(result!.years).toBe(0);
    expect(result!.months).toBe(11);
  });

  it('returns null when birth is after the reference date', () => {
    expect(calculateAge(new Date('2030-01-01'), new Date('2026-01-01'))).toBeNull();
  });

  it('finds the next birthday', () => {
    const next = nextBirthday(new Date('1990-12-25'), new Date('2026-06-19'));
    expect(next!.getMonth()).toBe(11);
    expect(next!.getDate()).toBe(25);
    expect(next!.getFullYear()).toBe(2026);
  });
});

describe('dateDifference', () => {
  it('counts days between two dates', () => {
    const diff = dateDifference(new Date('2026-01-01'), new Date('2026-12-31'));
    expect(diff!.days).toBe(364);
    expect(diff!.direction).toBe(1);
  });

  it('is order-independent for magnitude', () => {
    const a = dateDifference(new Date('2026-01-01'), new Date('2026-02-01'))!;
    const b = dateDifference(new Date('2026-02-01'), new Date('2026-01-01'))!;
    expect(a.days).toBe(b.days);
    expect(b.direction).toBe(-1);
  });

  it('adds days correctly', () => {
    expect(addDays(new Date('2026-01-01'), 31).toISOString().slice(0, 10)).toBe('2026-02-01');
  });
});
