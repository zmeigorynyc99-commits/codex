'use client';

import { useMemo, useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import {
  COMMON_TIMEZONES,
  formatInTimeZone,
  getZoneOffsetMinutes,
  formatOffset,
} from '@/lib/tools-logic/timezone';

function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TimeZoneConverter() {
  const [datetime, setDatetime] = useState(nowLocalInput());
  const [sourceZone, setSourceZone] = useState(localZone());
  const [targets, setTargets] = useState<string[]>(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']);

  // Interpret the wall-clock input as being in the source zone, producing a UTC instant.
  const instant = useMemo(() => {
    const match = datetime.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
    if (!match) return null;
    const [, y, mo, d, h, mi] = match.map(Number);
    const guessUtc = Date.UTC(y!, mo! - 1, d!, h!, mi!);
    // Adjust by the source zone's offset at that approximate instant.
    const offset = getZoneOffsetMinutes(new Date(guessUtc), sourceZone);
    return new Date(guessUtc - offset * 60000);
  }, [datetime, sourceZone]);

  const allZones = Array.from(new Set([localZone(), ...COMMON_TIMEZONES]));

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="dt" className="label">Date &amp; time</label>
          <input id="dt" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="src" className="label">Source time zone</label>
          <select id="src" value={sourceZone} onChange={(e) => setSourceZone(e.target.value)} className="input">
            {allZones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className="label">Converted times</p>
        <div className="space-y-2">
          {instant &&
            targets.map((zone, idx) => (
              <div key={`${zone}-${idx}`} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <select
                  value={zone}
                  onChange={(e) => {
                    const next = [...targets];
                    next[idx] = e.target.value;
                    setTargets(next);
                  }}
                  className="input w-44 py-1.5 text-sm"
                  aria-label={`Target zone ${idx + 1}`}
                >
                  {COMMON_TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <div className="flex-1 text-right">
                  <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                    {formatInTimeZone(instant, zone)}
                  </div>
                  <div className="text-xs text-slate-500">{formatOffset(getZoneOffsetMinutes(instant, zone))}</div>
                </div>
                {targets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTargets(targets.filter((_, i) => i !== idx))}
                    className="btn-secondary !px-2 !py-1 text-xs"
                    aria-label="Remove zone"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
        </div>
        {targets.length < 8 && (
          <button type="button" onClick={() => setTargets([...targets, 'UTC'])} className="btn-secondary mt-3 text-sm">
            + Add time zone
          </button>
        )}
      </div>
    </ToolShell>
  );
}
