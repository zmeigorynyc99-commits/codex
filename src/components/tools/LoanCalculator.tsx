'use client';

import { useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { calculateLoan } from '@/lib/tools-logic/loan';

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function LoanCalculator() {
  const [amount, setAmount] = useState('20000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('5');

  const result = calculateLoan(Number(amount), Number(rate), Number(years));

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="amt" className="label">Loan amount</label>
          <input id="amt" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="rate" className="label">Annual rate (%)</label>
          <input id="rate" type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="years" className="label">Term (years)</label>
          <input id="years" type="number" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} className="input" />
        </div>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 p-4 text-center dark:bg-brand-900/30">
            <p className="text-sm text-slate-600 dark:text-slate-300">Monthly payment</p>
            <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">{money(result.monthlyPayment)}</p>
          </div>
          <div>
            <StatRow label="Total of payments" value={money(result.totalPayment)} />
            <StatRow label="Total interest" value={money(result.totalInterest)} />
            <StatRow label="Principal" value={money(Number(amount))} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">Enter a positive amount and term.</p>
      )}

      <p className="text-xs text-slate-500">
        Estimate for fixed-rate, fully amortising loans. Excludes fees, insurance and taxes. Actual offers may vary.
      </p>
    </ToolShell>
  );
}
