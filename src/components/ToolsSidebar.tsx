'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { TOOLS, getCategory } from '@/lib/tools';
import { clampText } from '@/lib/tools-logic/limits';

/** Compact, searchable list of tools for the homepage right rail. */
export function ToolsSidebar() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter((t) =>
      [t.name, t.description, ...t.keywords].join(' ').toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tools</h2>
        <Link href="/tools" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
          All {TOOLS.length} →
        </Link>
      </div>

      <label htmlFor="sidebar-tool-search" className="sr-only">Search tools</label>
      <input
        id="sidebar-tool-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(clampText(e.target.value, 100))}
        placeholder="Search tools…"
        maxLength={100}
        className="input mb-3 py-1.5 text-sm"
        autoComplete="off"
      />

      <ul className="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <li className="px-2 py-3 text-sm text-slate-500">No tools match “{query}”.</li>
        )}
        {filtered.map((tool) => {
          const category = getCategory(tool.category);
          return (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span aria-hidden="true">{category?.icon}</span>
                <span className="truncate">{tool.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
