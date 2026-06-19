'use client';

import { useEffect, useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { countdownTo, businessDaysBetween } from '@/lib/tools-logic/countdown';

function defaultTarget(): string {
  const d = new Date();
  d.setMonth(11, 31);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CountdownCalculator() {
  const [target, setTarget] = useState(defaultTarget());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // tick forces a re-render every second so the live countdown updates.
  void tick;
  const targetDate = new Date(target);
  const cd = countdownTo(targetDate);
  const business = businessDaysBetween(new Date(), targetDate);

  return (
    <ToolShell>
      <div>
        <label htmlFor="target" className="label">Target date &amp; time</label>
        <input id="target" type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} className="input" />
      </div>

      {cd ? (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Days', cd.days],
              ['Hours', cd.hours],
              ['Minutes', cd.minutes],
              ['Seconds', cd.seconds],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/30">
                <div className="font-mono text-2xl font-bold text-brand-700 dark:text-brand-300">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-300">
            {cd.past ? 'This date has already passed.' : 'Time remaining (updates live).'}
          </p>
          <div>
            <StatRow label="Total days" value={cd.totalDays.toLocaleString()} />
            <StatRow label="Total hours" value={cd.totalHours.toLocaleString()} />
            <StatRow label="Total seconds" value={cd.totalSeconds.toLocaleString()} />
            <StatRow label="Business days (Mon–Fri)" value={business.toLocaleString()} />
          </div>
        </>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">Pick a valid target date and time.</p>
      )}
    </ToolShell>
  );
}
