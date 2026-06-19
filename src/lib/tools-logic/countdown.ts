/** Countdown / time-remaining calculations toward a target date. */

export interface Countdown {
  past: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
}

export function countdownTo(target: Date, from: Date = new Date()): Countdown | null {
  if (Number.isNaN(target.getTime()) || Number.isNaN(from.getTime())) return null;
  const diffMs = target.getTime() - from.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const totalSeconds = Math.floor(abs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    past,
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    totalDays: Math.floor(totalSeconds / 86400),
    totalHours: Math.floor(totalSeconds / 3600),
  };
}

/** Counts business days (Mon–Fri) between two dates, inclusive of neither end's time. */
export function businessDaysBetween(from: Date, to: Date): number {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const start = new Date(Math.min(from.getTime(), to.getTime()));
  const end = new Date(Math.max(from.getTime(), to.getTime()));
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
