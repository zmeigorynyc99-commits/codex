/** Time-zone helpers built on the Intl API (no external data needed). */

/** A curated list of common IANA time zones for the converter UI. */
export const COMMON_TIMEZONES: string[] = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

/**
 * Formats an instant (Date) as it appears in a given IANA time zone.
 * Throws for an invalid time zone string, so callers should guard input.
 */
export function formatInTimeZone(date: Date, timeZone: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'long',
    hour12: false,
  }).format(date);
}

/** Returns the UTC offset (in minutes) for a zone at a given instant. */
export function getZoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Formats an offset in minutes as "UTC+05:30". */
export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}
