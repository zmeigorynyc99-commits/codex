/** Difference between two dates, expressed in multiple units. */

export interface DateDiffResult {
  /** Absolute whole-day difference. */
  days: number;
  weeks: number;
  /** Remaining days after whole weeks. */
  weekRemainderDays: number;
  /** Calendar-aware breakdown. */
  years: number;
  months: number;
  monthRemainderDays: number;
  /** Sign of (to - from): -1, 0 or 1. */
  direction: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function dateDifference(from: Date, to: Date): DateDiffResult | null {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  const direction = Math.sign(to.getTime() - from.getTime());
  const start = direction < 0 ? to : from;
  const end = direction < 0 ? from : to;

  const days = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);

  // Calendar-aware year/month/day breakdown.
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let dayPart = end.getDate() - start.getDate();
  if (dayPart < 0) {
    months -= 1;
    const prevMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    dayPart += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    days,
    weeks: Math.floor(days / 7),
    weekRemainderDays: days % 7,
    years,
    months,
    monthRemainderDays: dayPart,
    direction,
  };
}

/** Adds (or subtracts, with a negative count) whole days to a date. */
export function addDays(date: Date, count: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + count);
  return result;
}
