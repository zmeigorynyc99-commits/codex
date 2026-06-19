'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { DIFFICULTIES, DISTRIBUTIONS } from '@/lib/cms/constants';
import type { Category } from '@/lib/cms/types';

export function TutorialFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');

  function apply(next: Record<string, string>) {
    const merged = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    merged.delete('page'); // reset to first page on any filter change
    router.push(`/linux-tutorials?${merged.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: search.trim().slice(0, 100) });
        }}
      >
        <label htmlFor="t-search" className="sr-only">Search tutorials</label>
        <input
          id="t-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
          placeholder="Search tutorials…"
          className="input"
        />
      </form>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          aria-label="Category"
          value={params.get('category') ?? ''}
          onChange={(e) => apply({ category: e.target.value })}
          className="input py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          aria-label="Difficulty"
          value={params.get('difficulty') ?? ''}
          onChange={(e) => apply({ difficulty: e.target.value })}
          className="input py-1.5 text-sm"
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          aria-label="Linux distribution"
          value={params.get('distribution') ?? ''}
          onChange={(e) => apply({ distribution: e.target.value })}
          className="input py-1.5 text-sm"
        >
          <option value="">All distributions</option>
          {DISTRIBUTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {(params.get('q') || params.get('category') || params.get('difficulty') || params.get('distribution') || params.get('tag')) && (
        <button
          type="button"
          onClick={() => {
            setSearch('');
            router.push('/linux-tutorials');
          }}
          className="text-sm text-brand-700 hover:underline dark:text-brand-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
