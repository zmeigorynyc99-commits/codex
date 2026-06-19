import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site';
import { CATEGORIES, getToolsByCategory } from '@/lib/tools';
import { ToolSearchGrid } from '@/components/ToolSearchGrid';
import { AdSlot } from '@/components/AdSlot';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const initialQuery = typeof searchParams.q === 'string' ? searchParams.q : '';

  return (
    <div className="container-content py-10">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{siteConfig.name}</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          A growing collection of fast, free, privacy-friendly online tools. No sign-up, no tracking —
          everything runs right in your browser.
        </p>
      </section>

      <section className="mt-10">
        <ToolSearchGrid initialQuery={initialQuery} />
      </section>

      <AdSlot format="leaderboard" className="my-10" />

      <section aria-labelledby="categories-heading" className="mt-4">
        <h2 id="categories-heading" className="text-2xl font-bold">
          Browse by category
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="card transition-shadow hover:shadow-md"
            >
              <div className="text-3xl" aria-hidden="true">{category.icon}</div>
              <h3 className="mt-2 text-lg font-semibold">{category.name}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
              <p className="mt-2 text-xs text-slate-400">{getToolsByCategory(category.id).length} tools</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
