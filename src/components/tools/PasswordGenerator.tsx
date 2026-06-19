'use client';

import { useCallback, useEffect, useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import {
  generatePassword,
  estimateStrength,
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  type PasswordOptions,
} from '@/lib/tools-logic/password';

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-600'];

export default function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const regenerate = useCallback((opts: PasswordOptions) => {
    try {
      setPassword(generatePassword(opts));
      setError('');
    } catch (err) {
      setPassword('');
      setError(err instanceof Error ? err.message : 'Unable to generate a password.');
    }
  }, []);

  // Generate one on mount.
  useEffect(() => {
    regenerate(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(patch: Partial<PasswordOptions>) {
    const next = { ...options, ...patch };
    setOptions(next);
    regenerate(next);
  }

  const strength = estimateStrength(password);

  return (
    <ToolShell>
      <div className="flex items-center gap-3">
        <output className="result-box flex-1 text-base" aria-label="Generated password">
          {password || '—'}
        </output>
        <CopyButton value={password} disabled={!password} />
      </div>

      {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}

      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Strength: {strength.label}</span>
          <span>{strength.bits} bits</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-all ${STRENGTH_COLORS[strength.score]}`}
            style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="length" className="label">
          Length: {options.length}
        </label>
        <input
          id="length"
          type="range"
          min={PASSWORD_LENGTH_MIN}
          max={PASSWORD_LENGTH_MAX}
          value={options.length}
          onChange={(e) => update({ length: Number(e.target.value) })}
          className="w-full accent-brand-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Toggle label="Lowercase (a–z)" checked={options.lowercase} onChange={(v) => update({ lowercase: v })} />
        <Toggle label="Uppercase (A–Z)" checked={options.uppercase} onChange={(v) => update({ uppercase: v })} />
        <Toggle label="Numbers (0–9)" checked={options.numbers} onChange={(v) => update({ numbers: v })} />
        <Toggle label="Symbols (!@#…)" checked={options.symbols} onChange={(v) => update({ symbols: v })} />
        <Toggle label="Exclude look-alikes" checked={options.excludeAmbiguous} onChange={(v) => update({ excludeAmbiguous: v })} />
      </div>

      <button type="button" onClick={() => regenerate(options)} className="btn-primary">
        Regenerate
      </button>
    </ToolShell>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded" />
      {label}
    </label>
  );
}
