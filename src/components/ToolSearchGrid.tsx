'use client';

import { useMemo, useState } from 'react';
import { TOOLS, CATEGORIES, type CategoryId } from '@/lib/tools';
import { ToolCard } from './ToolCard';
import { clampText } from '@/lib/tools-logic/limits';

interface Props {
  initialQuery?: string;
  showCategoryFilter?: boolean;
}

/**
 * Client-side search and category filter over the static tool list. Pure
 * string matching against names, descriptions and keywords — no network calls.
 */
export function ToolSearchGrid({ initialQuery = '', showCategoryFilter = true }: Props) {
  const [query, setQuery] = useState(clampText(initialQuery, 100));
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (activeCategory !== 'all' && tool.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [tool.name, tool.description, ...tool.keywords].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeCategory]);

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="tool-search" className="sr-only">
          Search tools
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(clampText(e.target.value, 100))}
            placeholder="Search for a tool (e.g. password, percentage, JSON)…"
            maxLength={100}
            className="input pl-10"
            autoComplete="off"
          />
        </div>
      </div>

      {showCategoryFilter && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <CategoryChip
            label="All"
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {CATEGORIES.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          No tools found. Try a different search.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
}
