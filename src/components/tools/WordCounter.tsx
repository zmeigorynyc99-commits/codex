'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { analyzeText } from '@/lib/tools-logic/text-stats';
import { INPUT_LIMITS, clampText } from '@/lib/tools-logic/limits';

export default function WordCounter() {
  const [text, setText] = useState('');
  const stats = analyzeText(text);

  const items: Array<[string, string]> = [
    ['Words', stats.words.toLocaleString()],
    ['Characters', stats.characters.toLocaleString()],
    ['Characters (no spaces)', stats.charactersNoSpaces.toLocaleString()],
    ['Sentences', stats.sentences.toLocaleString()],
    ['Paragraphs', stats.paragraphs.toLocaleString()],
    ['Lines', stats.lines.toLocaleString()],
    ['Reading time', `${stats.readingTimeMinutes} min`],
  ];

  return (
    <ToolShell>
      <div>
        <label htmlFor="text" className="label">Your text</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(clampText(e.target.value, INPUT_LIMITS.longText))}
          rows={8}
          maxLength={INPUT_LIMITS.longText}
          placeholder="Start typing or paste your text…"
          className="input font-sans"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {text.length.toLocaleString()} / {INPUT_LIMITS.longText.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="text-xl font-bold text-brand-700 dark:text-brand-300">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setText('')} className="btn-secondary">Clear</button>
    </ToolShell>
  );
}
