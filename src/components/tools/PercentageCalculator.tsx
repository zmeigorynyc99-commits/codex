'use client';

import { useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import {
  percentOf,
  whatPercent,
  percentChange,
  addPercent,
  subtractPercent,
} from '@/lib/tools-logic/percentage';

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return Number(n.toFixed(6)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function num(value: string): number {
  return value.trim() === '' ? NaN : Number(value);
}

export default function PercentageCalculator() {
  const [a1, setA1] = useState('20');
  const [a2, setA2] = useState('80');
  const [b1, setB1] = useState('16');
  const [b2, setB2] = useState('80');
  const [c1, setC1] = useState('80');
  const [c2, setC2] = useState('96');

  return (
    <ToolShell>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900 dark:text-white">
          What is X% of Y?
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Percent (%)" value={a1} onChange={setA1} />
          <span className="pb-2 text-slate-500">of</span>
          <Field label="Value" value={a2} onChange={setA2} />
        </div>
        <StatRow label={`${a1 || '0'}% of ${a2 || '0'}`} value={fmt(percentOf(num(a1), num(a2)))} />
        <div className="grid grid-cols-2 gap-2">
          <StatRow label="Add %" value={fmt(addPercent(num(a2), num(a1)))} />
          <StatRow label="Subtract %" value={fmt(subtractPercent(num(a2), num(a1)))} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <legend className="text-sm font-semibold text-slate-900 dark:text-white">
          X is what percent of Y?
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Value" value={b1} onChange={setB1} />
          <span className="pb-2 text-slate-500">is what % of</span>
          <Field label="Total" value={b2} onChange={setB2} />
        </div>
        <StatRow label={`${b1 || '0'} of ${b2 || '0'}`} value={`${fmt(whatPercent(num(b1), num(b2)))}%`} />
      </fieldset>

      <fieldset className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <legend className="text-sm font-semibold text-slate-900 dark:text-white">
          Percentage change from X to Y
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From" value={c1} onChange={setC1} />
          <span className="pb-2 text-slate-500">to</span>
          <Field label="To" value={c2} onChange={setC2} />
        </div>
        <StatRow
          label="Change"
          value={`${percentChange(num(c1), num(c2)) >= 0 ? '+' : ''}${fmt(percentChange(num(c1), num(c2)))}%`}
        />
      </fieldset>
    </ToolShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <label className="label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 20))}
        className="input"
      />
    </div>
  );
}
