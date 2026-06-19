'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { encodeUrl, decodeUrl, encodeUrlComponentPlus } from '@/lib/tools-logic/codecs';
import { INPUT_LIMITS, clampText } from '@/lib/tools-logic/limits';

export default function UrlEncoderDecoder() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [plusSpaces, setPlusSpaces] = useState(false);
  const [input, setInput] = useState('hello world & more=value');

  let output = '';
  let error = '';
  try {
    if (mode === 'encode') {
      output = plusSpaces ? encodeUrlComponentPlus(input) : encodeUrl(input);
    } else {
      output = decodeUrl(input.replace(/\+/g, '%20'));
    }
  } catch {
    error = 'The input is not valid URL-encoded text.';
  }

  return (
    <ToolShell>
      <div className="flex gap-2" role="group" aria-label="Mode">
        {(['encode', 'decode'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
              mode === m ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'encode' && (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={plusSpaces} onChange={(e) => setPlusSpaces(e.target.checked)} className="h-4 w-4 rounded" />
          Encode spaces as “+” (for query strings)
        </label>
      )}

      <div>
        <label htmlFor="in" className="label">Input</label>
        <textarea id="in" value={input} onChange={(e) => setInput(clampText(e.target.value, INPUT_LIMITS.longText))} rows={4} className="input font-mono text-sm" />
      </div>

      <div>
        <label htmlFor="out" className="label">Output</label>
        {error ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        ) : (
          <textarea id="out" readOnly value={output} rows={4} className="input font-mono text-sm" />
        )}
      </div>

      <div className="flex gap-3">
        <CopyButton value={output} disabled={!!error} />
        <button type="button" onClick={() => setInput('')} className="btn-secondary">Clear</button>
      </div>
    </ToolShell>
  );
}
