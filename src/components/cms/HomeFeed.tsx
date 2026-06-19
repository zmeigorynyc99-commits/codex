import Link from 'next/link';
import { listLatestPublished } from '@/lib/cms/tutorials';
import { formatDate } from '@/lib/cms/format';
import { DifficultyBadge, NeutralBadge } from './Badges';

/**
 * "Latest Linux Tutorials" news feed for the homepage. Renders nothing until
 * at least one tutorial is published, and never shows drafts.
 */
export function HomeFeed() {
  let tutorials;
  try {
    tutorials = listLatestPublished(3);
  } catch {
    return null; // database not yet available (e.g. first boot before migrate)
  }
  if (tutorials.length === 0) return null;

  return (
    <section aria-labelledby="feed-heading" className="mt-14">
      <div className="flex items-end justify-between">
        <h2 id="feed-heading" className="text-2xl font-bold">Latest Linux Tutorials</h2>
        <Link href="/linux-tutorials" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
          View all tutorials →
        </Link>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {tutorials.map((t) => (
          <article key={t.id} className="card flex h-full flex-col">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <DifficultyBadge value={t.difficulty} />
              {t.category && <NeutralBadge>{t.category.name}</NeutralBadge>}
            </div>
            <h3 className="font-semibold">
              <Link href={`/linux-tutorials/${t.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                {t.title}
              </Link>
            </h3>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{t.summary}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{formatDate(t.publishedAt)}</span>
              <Link href={`/linux-tutorials/${t.slug}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                Read tutorial →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
