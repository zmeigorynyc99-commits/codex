import { describe, it, expect } from 'vitest';
import {
  getAllTimeZones,
  getZoneShortName,
  getZoneOffsetMinutes,
  formatOffset,
} from '@/lib/tools-logic/timezone';

describe('time zone helpers', () => {
  it('lists many IANA zones including UTC and major cities', () => {
    const zones = getAllTimeZones();
    expect(zones).toContain('UTC');
    expect(zones).toContain('Europe/London');
    expect(zones).toContain('Asia/Kolkata');
    // The full IANA database has hundreds of zones.
    expect(zones.length).toBeGreaterThan(100);
  });

  it('produces a GMT/short label for a zone', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const short = getZoneShortName(date, 'UTC');
    expect(short).toMatch(/UTC|GMT/);
    expect(getZoneShortName(date, 'Asia/Kolkata')).toBeTruthy();
  });

  it('computes offsets and formats them as GMT-style strings', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    expect(getZoneOffsetMinutes(date, 'UTC')).toBe(0);
    expect(getZoneOffsetMinutes(date, 'Asia/Kolkata')).toBe(330); // +05:30
    expect(formatOffset(330)).toBe('UTC+05:30');
    expect(formatOffset(-300)).toBe('UTC-05:00');
  });
});
