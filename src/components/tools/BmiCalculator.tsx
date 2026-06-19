'use client';

import { useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { bmiMetric, bmiImperial, type BmiResult } from '@/lib/tools-logic/bmi';

const CATEGORY_COLOR: Record<BmiResult['category'], string> = {
  Underweight: 'text-sky-600 dark:text-sky-400',
  Normal: 'text-green-600 dark:text-green-400',
  Overweight: 'text-amber-600 dark:text-amber-400',
  Obese: 'text-red-600 dark:text-red-400',
};

export default function BmiCalculator() {
  const [system, setSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('175');

  const w = Number(weight);
  const h = Number(height);
  const result = system === 'metric' ? bmiMetric(w, h) : bmiImperial(w, h);

  return (
    <ToolShell>
      <div className="flex gap-2" role="group" aria-label="Unit system">
        {(['metric', 'imperial'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSystem(s);
              setWeight(s === 'metric' ? '70' : '154');
              setHeight(s === 'metric' ? '175' : '69');
            }}
            aria-pressed={system === s}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
              system === s
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="w" className="label">Weight ({system === 'metric' ? 'kg' : 'lb'})</label>
          <input id="w" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="h" className="label">Height ({system === 'metric' ? 'cm' : 'inches'})</label>
          <input id="h" type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} className="input" />
        </div>
      </div>

      {result ? (
        <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-950">
          <p className="text-4xl font-bold text-slate-900 dark:text-white">{result.bmi}</p>
          <p className={`mt-1 font-semibold ${CATEGORY_COLOR[result.category]}`}>{result.category}</p>
          <div className="mt-3 text-left">
            <StatRow label="Underweight" value="< 18.5" />
            <StatRow label="Normal" value="18.5 – 24.9" />
            <StatRow label="Overweight" value="25 – 29.9" />
            <StatRow label="Obese" value="≥ 30" />
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">Enter a positive weight and height.</p>
      )}

      <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        <strong>Disclaimer:</strong> BMI is a general screening figure and does not account for muscle
        mass, body composition, age, sex or ethnicity. It is provided for information only and is not
        medical advice. Consult a qualified healthcare professional for guidance about your health.
      </p>
    </ToolShell>
  );
}
