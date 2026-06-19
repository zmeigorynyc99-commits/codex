'use client';

import { useEffect, useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { describeTimestamp, dateStringToUnix } from '@/lib/tools-logic/unix-time';

export default function UnixTimestampConverter() {
  const [timestamp, setTimestamp] = useState('1700000000');
  const [dateInput, setDateInput] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const breakdown = describeTimestamp(Number(timestamp));
  const fromDate = dateInput ? dateStringToUnix(dateInput) : null;

  return (
    <ToolShell>
      <div className="rounded-lg bg-brand-50 p-3 text-center dark:bg-brand-900/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">Current Unix time</p>
        <p className="font-mono text-2xl font-bold text-brand-700 dark:text-brand-300">{now || '…'}</p>
      </div>

      <div>
        <label htmlFor="ts" className="label">Timestamp → date (seconds or milliseconds)</label>
        <input id="ts" type="text" inputMode="numeric" value={timestamp} onChange={(e) => setTimestamp(e.target.value.replace(/[^0-9-]/g, '').slice(0, 16))} className="input font-mono" />
      </div>

      {breakdown ? (
        <div>
          <StatRow label="UTC" value={breakdown.utc} />
          <StatRow label="ISO 8601" value={breakdown.iso} />
          <StatRow label="Local time" value={breakdown.local} />
          <StatRow label="Relative" value={breakdown.relative} />
          <StatRow label="Seconds" value={String(breakdown.seconds)} />
        </div>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">Enter a valid numeric timestamp.</p>
      )}

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <label htmlFor="date" className="label">Date → timestamp</label>
        <input id="date" type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="input" />
        {fromDate !== null && (
          <div className="mt-3 flex items-center gap-3">
            <output className="result-box flex-1">{fromDate} seconds</output>
            <CopyButton value={String(fromDate)} />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
