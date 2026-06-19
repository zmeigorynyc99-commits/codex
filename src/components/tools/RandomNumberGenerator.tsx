'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { randomInts } from '@/lib/tools-logic/random';

export default function RandomNumberGenerator() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [unique, setUnique] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [error, setError] = useState('');

  function generate() {
    setError('');
    const lo = Number(min);
    const hi = Number(max);
    const n = Math.min(1000, Math.max(1, Math.floor(Number(count) || 1)));
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      setError('Please enter valid numbers for the range.');
      return;
    }
    if (unique && n > Math.abs(hi - lo) + 1) {
      setError('Not enough numbers in the range for that many unique values.');
      return;
    }
    setResults(randomInts(lo, hi, n, unique));
  }

  function reset() {
    setResults([]);
    setError('');
  }

  return (
    <ToolShell>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="min" className="label">Minimum</label>
          <input id="min" type="number" value={min} onChange={(e) => setMin(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="max" className="label">Maximum</label>
          <input id="max" type="number" value={max} onChange={(e) => setMax(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="count" className="label">How many (1–1000)</label>
          <input id="count" type="number" min={1} max={1000} value={count} onChange={(e) => setCount(e.target.value)} className="input" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} className="h-4 w-4 rounded" />
        Unique values only (no repeats)
      </label>

      <div className="flex gap-3">
        <button type="button" onClick={generate} className="btn-primary">Generate</button>
        <button type="button" onClick={reset} className="btn-secondary">Reset</button>
      </div>

      {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="result-box">{results.join(', ')}</div>
          <CopyButton value={results.join(', ')} />
        </div>
      )}
    </ToolShell>
  );
}
