import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site';
import { listLatestPublished, listFeaturedPublished } from '@/lib/cms/tutorials';
import { listThreads } from '@/lib/cms/forum';
import { TutorialCard } from '@/components/cms/TutorialCard';
import { ToolsSidebar } from '@/components/ToolsSidebar';
import { AdSlot } from '@/components/AdSlot';
import { SupportCta } from '@/components/community/SupportCta';
import { formatDate } from '@/lib/cms/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export default function HomePage() {
  const featured = safe(() => listFeaturedPublished(2), []);
  const latest = safe(() => listLatestPublished(6), []);
  const threads = safe(() => listThreads({ publicOnly: true, pageSize: 5 }).items, []);
  // Avoid duplicating featured items in the latest list.
  const featuredIds = new Set(featured.map((t) => t.id));
  const latestOnly = latest.filter((t) => !featuredIds.has(t.id));

  return (
    <div className="container-content py-10">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{siteConfig.name}</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Linux administration tutorials, a community forum, and a growing set of fast, privacy-friendly
          browser tools. No sign-up, no tracking.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/linux-tutorials" className="btn-primary">Browse tutorials</Link>
          <Link href="/forum" className="btn-secondary">Visit the forum</Link>
        </div>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_330px]">
        {/* LEFT: tutorials feed + forum */}
        <div className="min-w-0">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Latest Linux Tutorials</h2>
            <Link href="/linux-tutorials" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              View all tutorials →
            </Link>
          </div>

          {featured.length === 0 && latestOnly.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
              <p>No tutorials have been published yet.</p>
              <p className="mt-1 text-sm">Check back soon, or explore the tools on the right.</p>
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {featured.map((t) => (
                    <TutorialCard key={t.id} tutorial={t} />
                  ))}
                </div>
              )}
              {latestOnly.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {latestOnly.map((t) => (
                    <TutorialCard key={t.id} tutorial={t} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Forum teaser */}
          <section aria-labelledby="forum-teaser" className="mt-10">
            <div className="flex items-end justify-between">
              <h2 id="forum-teaser" className="text-2xl font-bold">From the forum</h2>
              <Link href="/forum" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
                Open forum →
              </Link>
            </div>
            {threads.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                No discussions yet — <Link href="/forum" className="text-brand-700 hover:underline dark:text-brand-300">start one</Link>.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {threads.map((thread) => (
                  <li key={thread.id} className="bg-white dark:bg-slate-900">
                    <Link href={`/forum/${thread.slug}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900 dark:text-white">{thread.title}</span>
                        <span className="text-xs text-slate-500">{thread.authorName} · {formatDate(thread.createdAt)}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{thread.replyCount} repl{thread.replyCount === 1 ? 'y' : 'ies'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT: tools + support */}
        <aside className="space-y-6">
          <ToolsSidebar />
          <SupportCta compact />
          <AdSlot format="rectangle" />
        </aside>
      </div>
    </div>
  );
}
