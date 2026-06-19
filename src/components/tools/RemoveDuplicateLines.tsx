'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { removeDuplicateLines, type DedupeOptions } from '@/lib/tools-logic/dedupe';
import { INPUT_LIMITS, clampText } from '@/lib/tools-logic/limits';

export default function RemoveDuplicateLines() {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<DedupeOptions>({
    caseSensitive: true,
    trimLines: true,
    removeEmpty: true,
    sort: 'none',
    keep: 'first',
  });

  const result = removeDuplicateLines(text, options);

  function set<K extends keyof DedupeOptions>(key: K, value: DedupeOptions[K]) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ToolShell>
      <div>
        <label htmlFor="text" className="label">Input lines</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(clampText(e.target.value, INPUT_LIMITS.longText))}
          rows={6}
          maxLength={INPUT_LIMITS.longText}
          placeholder="Paste your list, one item per line…"
          className="input font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Toggle label="Case sensitive" checked={options.caseSensitive} onChange={(v) => set('caseSensitive', v)} />
        <Toggle label="Trim whitespace" checked={options.trimLines} onChange={(v) => set('trimLines', v)} />
        <Toggle label="Remove empty lines" checked={options.removeEmpty} onChange={(v) => set('removeEmpty', v)} />
        <div>
          <label htmlFor="sort" className="label">Sort</label>
          <select id="sort" value={options.sort} onChange={(e) => set('sort', e.target.value as DedupeOptions['sort'])} className="input py-1.5 text-sm">
            <option value="none">Keep order</option>
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </div>
        <div>
          <label htmlFor="keep" className="label">Keep</label>
          <select id="keep" value={options.keep} onChange={(e) => set('keep', e.target.value as DedupeOptions['keep'])} className="input py-1.5 text-sm">
            <option value="first">First occurrence</option>
            <option value="last">Last occurrence</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {result.inputCount.toLocaleString()} lines in · {result.outputCount.toLocaleString()} unique · {result.removed.toLocaleString()} removed
      </p>

      <div>
        <label htmlFor="out" className="label">Result</label>
        <textarea id="out" readOnly value={result.output} rows={6} className="input font-mono text-sm" />
      </div>

      <div className="flex gap-3">
        <CopyButton value={result.output} />
        <button type="button" onClick={() => setText('')} className="btn-secondary">Clear</button>
      </div>
    </ToolShell>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded" />
      {label}
    </label>
  );
}
