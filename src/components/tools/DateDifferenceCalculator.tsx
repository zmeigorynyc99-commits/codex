'use client';

import { useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { dateDifference } from '@/lib/tools-logic/date-diff';
import { businessDaysBetween } from '@/lib/tools-logic/countdown';

export default function DateDifferenceCalculator() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diff = dateDifference(fromDate, toDate);
  const business = businessDaysBetween(fromDate, toDate);

  return (
    <ToolShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="from" className="label">Start date</label>
          <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">End date</label>
          <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
      </div>

      {diff ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 p-4 text-center dark:bg-brand-900/30">
            <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">
              {diff.days.toLocaleString()} <span className="text-base font-medium">days</span>
            </p>
            {diff.direction !== 0 && (
              <p className="mt-1 text-xs text-slate-500">
                End date is {diff.direction > 0 ? 'after' : 'before'} the start date.
              </p>
            )}
          </div>
          <div>
            <StatRow label="Calendar breakdown" value={`${diff.years}y ${diff.months}m ${diff.monthRemainderDays}d`} />
            <StatRow label="Weeks" value={`${diff.weeks.toLocaleString()} weeks ${diff.weekRemainderDays} days`} />
            <StatRow label="Total days" value={diff.days.toLocaleString()} />
            <StatRow label="Business days (Mon–Fri)" value={business.toLocaleString()} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">Please enter two valid dates.</p>
      )}
    </ToolShell>
  );
}
