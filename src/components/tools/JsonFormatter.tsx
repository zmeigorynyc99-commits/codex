'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatJson, minifyJson, validateJson, type JsonResult } from '@/lib/tools-logic/json-tools';
import { INPUT_LIMITS, clampText } from '@/lib/tools-logic/limits';

const SAMPLE = '{"name":"Tiny Tools","tools":20,"free":true,"tags":["fast","private"]}';

export default function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2');
  const [result, setResult] = useState<JsonResult | null>(null);

  function run(action: 'format' | 'minify' | 'validate') {
    if (action === 'minify') setResult(minifyJson(input));
    else if (action === 'validate') setResult(validateJson(input));
    else setResult(formatJson(input, indent === 'tab' ? '\t' : Number(indent)));
  }

  return (
    <ToolShell>
      <div>
        <label htmlFor="json-in" className="label">JSON input</label>
        <textarea
          id="json-in"
          value={input}
          onChange={(e) => setInput(clampText(e.target.value, INPUT_LIMITS.longText))}
          rows={8}
          maxLength={INPUT_LIMITS.longText}
          spellCheck={false}
          className="input font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="indent" className="label">Indent</label>
          <select id="indent" value={indent} onChange={(e) => setIndent(e.target.value as typeof indent)} className="input py-1.5 text-sm">
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </div>
        <button type="button" onClick={() => run('format')} className="btn-primary">Beautify</button>
        <button type="button" onClick={() => run('minify')} className="btn-secondary">Minify</button>
        <button type="button" onClick={() => run('validate')} className="btn-secondary">Validate</button>
      </div>

      {result && (
        <div>
          {result.ok ? (
            <>
              <p className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">✓ Valid JSON</p>
              {result.output !== 'Valid JSON' && (
                <>
                  <textarea readOnly value={result.output} rows={8} className="input font-mono text-sm" aria-label="Formatted JSON" />
                  <div className="mt-3">
                    <CopyButton value={result.output} />
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              ✗ {result.error}
              {result.errorLine ? ` (line ${result.errorLine})` : ''}
            </p>
          )}
        </div>
      )}
    </ToolShell>
  );
}
