'use client';

import { useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { calculateAge, nextBirthday } from '@/lib/tools-logic/age';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AgeCalculator() {
  const [birth, setBirth] = useState('2000-01-01');
  const [at, setAt] = useState(todayStr());

  const birthDate = new Date(birth);
  const atDate = new Date(at);
  const result = calculateAge(birthDate, atDate);
  const next = nextBirthday(birthDate, atDate);
  const daysToNext = next
    ? Math.ceil((next.getTime() - new Date(at).getTime()) / 86_400_000)
    : null;

  return (
    <ToolShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dob" className="label">Date of birth</label>
          <input id="dob" type="date" value={birth} max={at} onChange={(e) => setBirth(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="ageat" className="label">Age at date</label>
          <input id="ageat" type="date" value={at} onChange={(e) => setAt(e.target.value)} className="input" />
        </div>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 p-4 text-center dark:bg-brand-900/30">
            <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">
              {result.years}
              <span className="text-base font-medium"> years </span>
              {result.months}
              <span className="text-base font-medium"> months </span>
              {result.days}
              <span className="text-base font-medium"> days</span>
            </p>
          </div>
          <div>
            <StatRow label="Total months" value={result.totalMonths.toLocaleString()} />
            <StatRow label="Total weeks" value={result.totalWeeks.toLocaleString()} />
            <StatRow label="Total days" value={result.totalDays.toLocaleString()} />
            {daysToNext !== null && (
              <StatRow
                label="Next birthday"
                value={daysToNext === 0 ? 'Today! 🎉' : `in ${daysToNext.toLocaleString()} day(s)`}
              />
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Please enter a valid date of birth on or before the “age at” date.
        </p>
      )}
    </ToolShell>
  );
}
