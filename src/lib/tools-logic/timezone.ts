/** Time-zone helpers built on the Intl API (no external data needed). */

/**
 * Every IANA time zone supported by the runtime (hundreds, covering all
 * countries), plus UTC/GMT. Falls back to the curated list on older engines
 * that lack Intl.supportedValuesOf.
 */
export function getAllTimeZones(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    if (typeof intl.supportedValuesOf === 'function') {
      const zones = intl.supportedValuesOf('timeZone');
      // Union with common aliases (e.g. Asia/Kolkata) so familiar names resolve
      // even when the runtime only lists canonical IDs (Asia/Calcutta).
      const set = new Set<string>(['UTC', 'GMT', ...zones, ...COMMON_TIMEZONES]);
      return Array.from(set).sort();
    }
  } catch {
    /* fall through to the curated list */
  }
  return [...COMMON_TIMEZONES];
}

/**
 * Returns a short zone label such as "GMT+5:30", "GMT", "EST" or "IST" for the
 * given instant, using the runtime's localized time-zone abbreviations.
 */
export function getZoneShortName(date: Date, timeZone: string, locale = 'en-US'): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

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
