import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl, siteConfig } from '@/lib/site';
import { listThreads } from '@/lib/cms/forum';
import { formatDate } from '@/lib/cms/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ForumNewThread } from '@/components/community/ForumNewThread';
import { Pagination } from '@/components/cms/Pagination';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community Forum — discuss Linux & self-hosting',
  description:
    'Ask questions and discuss Linux administration, servers and self-hosting with the botera community. No account required.',
  alternates: { canonical: absoluteUrl('/forum') },
  openGraph: { type: 'website', url: absoluteUrl('/forum'), title: `Forum · ${siteConfig.name}` },
};

export default function ForumPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const page = Number(searchParams.page) || 1;
  const result = listThreads({ publicOnly: true, search: searchParams.q, page, pageSize: 20 });

  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Forum' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Community Forum</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Ask questions and discuss Linux, servers and self-hosting. No account needed — just post.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ForumNewThread />
      </div>

      <ul className="mt-8 space-y-3">
        {result.items.length === 0 && (
          <li className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            No discussions yet. Be the first to start one!
          </li>
        )}
        {result.items.map((thread) => (
          <li key={thread.id}>
            <Link
              href={`/forum/${thread.slug}`}
              className="card flex items-center justify-between gap-4 hover:shadow-md"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {thread.pinned && <span className="badge badge-distro">Pinned</span>}
                  {thread.locked && <span className="badge badge-neutral">Locked</span>}
                  <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">{thread.title}</h2>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">
                  by {thread.authorName} · {formatDate(thread.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm text-slate-500">
                <div className="font-semibold text-slate-700 dark:text-slate-300">{thread.replyCount}</div>
                <div className="text-xs">repl{thread.replyCount === 1 ? 'y' : 'ies'}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Pagination page={result.page} totalPages={result.totalPages} searchParams={searchParams} basePath="/forum" />
    </div>
  );
}
