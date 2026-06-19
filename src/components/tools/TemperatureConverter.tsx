'use client';

import { useState } from 'react';
import { ToolShell, StatRow } from '@/components/ui/ToolShell';
import { convertTemperature, isPhysicallyValid, type TemperatureUnit } from '@/lib/tools-logic/temperature';

const UNITS: Array<{ id: TemperatureUnit; label: string; symbol: string }> = [
  { id: 'c', label: 'Celsius', symbol: '°C' },
  { id: 'f', label: 'Fahrenheit', symbol: '°F' },
  { id: 'k', label: 'Kelvin', symbol: 'K' },
];

function fmt(n: number): string {
  return Number(n.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export default function TemperatureConverter() {
  const [value, setValue] = useState('100');
  const [unit, setUnit] = useState<TemperatureUnit>('c');

  const v = Number(value);
  const valid = Number.isFinite(v) && isPhysicallyValid(v, unit);

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="val" className="label">Temperature</label>
          <input id="val" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.slice(0, 24))} className="input" />
        </div>
        <div>
          <label htmlFor="unit" className="label">Unit</label>
          <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as TemperatureUnit)} className="input">
            {UNITS.map((u) => <option key={u.id} value={u.id}>{u.label} ({u.symbol})</option>)}
          </select>
        </div>
      </div>

      {!Number.isFinite(v) ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">Enter a number to convert.</p>
      ) : !valid ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          That value is below absolute zero and is not physically possible.
        </p>
      ) : (
        <div>
          {UNITS.map((u) => (
            <StatRow
              key={u.id}
              label={`${u.label} (${u.symbol})`}
              value={`${fmt(convertTemperature(v, unit, u.id))} ${u.symbol}`}
            />
          ))}
        </div>
      )}
    </ToolShell>
  );
}
