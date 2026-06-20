'use client';

import { useMemo, useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import {
  getAllTimeZones,
  formatInTimeZone,
  getZoneOffsetMinutes,
  getZoneShortName,
  formatOffset,
  isValidTimeZone,
} from '@/lib/tools-logic/timezone';
import { buildZoneOptions } from '@/lib/tools-logic/timezone-data';
import { ZonePicker } from './ZonePicker';

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
  const [targets, setTargets] = useState<string[]>(['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo']);

  const options = useMemo(() => buildZoneOptions(getAllTimeZones()), []);

  // Interpret the wall-clock input as being in the source zone → a UTC instant.
  const instant = useMemo(() => {
    const match = datetime.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
    if (!match) return null;
    const [, y, mo, d, h, mi] = match.map(Number);
    const guessUtc = Date.UTC(y!, mo! - 1, d!, h!, mi!);
    const offset = isValidTimeZone(sourceZone) ? getZoneOffsetMinutes(new Date(guessUtc), sourceZone) : 0;
    const safeOffset = Number.isFinite(offset) ? offset : 0;
    return new Date(guessUtc - safeOffset * 60000);
  }, [datetime, sourceZone]);

  function describe(zone: string) {
    if (!instant || !isValidTimeZone(zone)) return { time: '—', offset: '', short: '' };
    return {
      time: formatInTimeZone(instant, zone) || '—',
      offset: formatOffset(getZoneOffsetMinutes(instant, zone)),
      short: getZoneShortName(instant, zone),
    };
  }

  const src = describe(sourceZone);

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="dt" className="label">Date &amp; time</label>
          <input id="dt" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="input" />
        </div>
        <div>
          <span className="label">Source time zone (search by country, city or zone)</span>
          <ZonePicker value={sourceZone} onChange={setSourceZone} options={options} ariaLabel="Source time zone" />
          {instant && (
            <p className="mt-1 text-xs text-slate-500">
              {src.offset}
              {src.short ? ` · ${src.short}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Quick UTC/GMT reference always visible. */}
      {instant && (
        <div className="rounded-lg bg-brand-50 p-3 text-center dark:bg-brand-900/30">
          <p className="text-xs text-slate-600 dark:text-slate-300">UTC / GMT</p>
          <p className="font-mono text-sm font-semibold text-brand-700 dark:text-brand-300">
            {formatInTimeZone(instant, 'UTC')}
          </p>
        </div>
      )}

      <div>
        <p className="label">Converted times ({options.length} zones available)</p>
        <div className="space-y-2">
          {instant &&
            targets.map((zone, idx) => {
              const d = describe(zone);
              return (
                <div key={`${zone}-${idx}`} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <ZonePicker
                    value={zone}
                    onChange={(z) => {
                      const next = [...targets];
                      next[idx] = z;
                      setTargets(next);
                    }}
                    options={options}
                    ariaLabel={`Target zone ${idx + 1}`}
                    className="w-56"
                  />
                  <div className="flex-1 text-right">
                    <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{d.time}</div>
                    <div className="text-xs text-slate-500">
                      {d.offset}
                      {d.short ? ` · ${d.short}` : ''}
                    </div>
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
              );
            })}
        </div>
        {targets.length < 12 && (
          <button type="button" onClick={() => setTargets([...targets, 'UTC'])} className="btn-secondary mt-3 text-sm">
            + Add time zone
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Search any country (e.g. Tajikistan), city or zone. Each row shows the local time, the GMT/UTC
        offset (e.g. GMT+05:00) and the zone short name (e.g. IST, EST, CET).
      </p>
    </ToolShell>
  );
}
