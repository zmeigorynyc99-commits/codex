'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { convertCase, type CaseMode } from '@/lib/tools-logic/text-case';
import { INPUT_LIMITS, clampText } from '@/lib/tools-logic/limits';

const MODES: Array<{ id: CaseMode; label: string }> = [
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'lower', label: 'lowercase' },
  { id: 'title', label: 'Title Case' },
  { id: 'sentence', label: 'Sentence case' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
  { id: 'alternating', label: 'aLtErNaTiNg' },
  { id: 'inverse', label: 'iNVERSE cASE' },
];

export default function TextCaseConverter() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<CaseMode>('title');
  const output = convertCase(text, mode);

  return (
    <ToolShell>
      <div>
        <label htmlFor="text" className="label">Input text</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(clampText(e.target.value, INPUT_LIMITS.longText))}
          rows={5}
          maxLength={INPUT_LIMITS.longText}
          placeholder="Type or paste text to convert…"
          className="input font-sans"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Case style">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              mode === m.id
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="out" className="label">Result</label>
        <textarea id="out" readOnly value={output} rows={5} className="input font-sans" />
      </div>

      <div className="flex gap-3">
        <CopyButton value={output} />
        <button type="button" onClick={() => setText('')} className="btn-secondary">Clear</button>
      </div>
    </ToolShell>
  );
}
