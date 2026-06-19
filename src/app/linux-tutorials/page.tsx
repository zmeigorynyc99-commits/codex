import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl, siteConfig } from '@/lib/site';
import {
  listTutorials,
  listFeaturedPublished,
  listCategories,
  type ListFilters,
} from '@/lib/cms/tutorials';
import { isDifficulty, isDistribution } from '@/lib/cms/constants';
import { TutorialCard } from '@/components/cms/TutorialCard';
import { TutorialFilters } from '@/components/cms/TutorialFilters';
import { Pagination } from '@/components/cms/Pagination';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Linux Tutorials — administration guides & how-tos',
  description:
    'Practical Linux administration tutorials: servers, networking, security, containers and the command line. Filter by category, difficulty and distribution.',
  alternates: {
    canonical: absoluteUrl('/linux-tutorials'),
    types: { 'application/rss+xml': absoluteUrl('/linux-tutorials/rss.xml') },
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/linux-tutorials'),
    title: `Linux Tutorials · ${siteConfig.name}`,
    description: 'Practical Linux administration tutorials and how-to guides.',
  },
};

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

export default function LinuxTutorialsPage({ searchParams }: PageProps) {
  const filters: ListFilters = {
    publishedOnly: true,
    page: Number(searchParams.page) || 1,
    pageSize: 9,
    search: searchParams.q,
    category: searchParams.category,
    tag: searchParams.tag,
    difficulty: isDifficulty(searchParams.difficulty) ? searchParams.difficulty : undefined,
    distribution: isDistribution(searchParams.distribution) ? searchParams.distribution : undefined,
  };

  const hasFilters = Boolean(
    searchParams.q || searchParams.category || searchParams.tag || searchParams.difficulty || searchParams.distribution,
  );

  const result = listTutorials(filters);
  const featured = hasFilters ? [] : listFeaturedPublished(3);
  const categories = listCategories();

  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Linux Tutorials' }]} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Linux Tutorials</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Practical, security-conscious guides for administering Linux servers and workstations.
          </p>
        </div>
        <a
          href="/linux-tutorials/rss.xml"
          className="btn-secondary text-sm"
          aria-label="Subscribe via RSS"
        >
          RSS feed
        </a>
      </div>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="mt-8">
          <h2 id="featured-heading" className="mb-3 text-xl font-bold">Featured</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featured.map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <TutorialFilters categories={categories} />
        </aside>

        <div>
          <h2 className="sr-only">Tutorials</h2>
          {result.items.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No tutorials found. {hasFilters && <Link href="/linux-tutorials" className="text-brand-700 hover:underline dark:text-brand-300">Clear filters</Link>}
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">{result.total} tutorial{result.total === 1 ? '' : 's'}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {result.items.map((t) => (
                  <TutorialCard key={t.id} tutorial={t} />
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} searchParams={searchParams} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
