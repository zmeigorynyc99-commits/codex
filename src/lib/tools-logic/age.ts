/** Age calculation based on calendar math (years, months, days). */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

function daysInMonth(year: number, monthIndex: number): number {
  // monthIndex is 0-based; day 0 of next month = last day of this month.
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Computes the elapsed time between `birth` and `on` (defaults to now) as a
 * years/months/days breakdown plus useful totals. Returns null when `birth`
 * is after `on` or either date is invalid.
 */
export function calculateAge(birth: Date, on: Date = new Date()): AgeResult | null {
  if (Number.isNaN(birth.getTime()) || Number.isNaN(on.getTime())) return null;
  if (birth.getTime() > on.getTime()) return null;

  let years = on.getFullYear() - birth.getFullYear();
  let months = on.getMonth() - birth.getMonth();
  let days = on.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    // Borrow days from the previous (relative to `on`) month.
    const borrowMonth = on.getMonth() - 1;
    const borrowYear = borrowMonth < 0 ? on.getFullYear() - 1 : on.getFullYear();
    const normalizedMonth = (borrowMonth + 12) % 12;
    days += daysInMonth(borrowYear, normalizedMonth);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor((on.getTime() - birth.getTime()) / msPerDay);
  const totalMonths = years * 12 + months;

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths,
  };
}

/** Returns the next birthday (month/day of `birth`) at or after `on`. */
export function nextBirthday(birth: Date, on: Date = new Date()): Date | null {
  if (Number.isNaN(birth.getTime()) || Number.isNaN(on.getTime())) return null;
  const candidate = new Date(on.getFullYear(), birth.getMonth(), birth.getDate());
  if (candidate.getTime() < new Date(on.getFullYear(), on.getMonth(), on.getDate()).getTime()) {
    candidate.setFullYear(on.getFullYear() + 1);
  }
  return candidate;
}
