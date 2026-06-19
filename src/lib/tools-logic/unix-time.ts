/** Unix timestamp <-> human-readable date conversion helpers. */

export interface TimestampBreakdown {
  seconds: number;
  milliseconds: number;
  iso: string;
  utc: string;
  local: string;
  relative: string;
}

/** Detects whether a numeric timestamp is in seconds or milliseconds. */
export function normalizeToMs(timestamp: number): number {
  // 1e12 ms ≈ year 2001; values below are assumed to be seconds.
  return Math.abs(timestamp) < 1e11 ? timestamp * 1000 : timestamp;
}

export function describeTimestamp(timestamp: number, now: Date = new Date()): TimestampBreakdown | null {
  if (!Number.isFinite(timestamp)) return null;
  const ms = normalizeToMs(timestamp);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;

  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: relativeTime(ms - now.getTime()),
  };
}

/** Converts an ISO/date string to seconds. Returns null when unparseable. */
export function dateStringToUnix(value: string): number | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(date.getTime() / 1000);
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
];

export function relativeTime(deltaMs: number): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (Math.abs(deltaMs) >= unitMs || unit === 'second') {
      return rtf.format(Math.round(deltaMs / unitMs), unit);
    }
  }
  return 'now';
}
