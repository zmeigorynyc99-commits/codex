import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import { TOOLS } from '@/lib/tools';
import { ToolSearchGrid } from '@/components/ToolSearchGrid';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'All Tools — browse every free utility',
  description:
    'Browse all free, privacy-friendly Tiny Tools: calculators, converters, text utilities, generators and developer tools. Search and filter by category.',
  alternates: { canonical: absoluteUrl('/tools') },
};

export default function AllToolsPage({ searchParams }: { searchParams: { q?: string } }) {
  const initialQuery = typeof searchParams.q === 'string' ? searchParams.q : '';

  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'All tools' }]} />
      <h1 className="text-3xl font-bold">All tools</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {TOOLS.length} free tools that run entirely in your browser. Search or filter by category.
      </p>
      <div className="mt-8">
        <ToolSearchGrid initialQuery={initialQuery} />
      </div>
    </div>
  );
}
