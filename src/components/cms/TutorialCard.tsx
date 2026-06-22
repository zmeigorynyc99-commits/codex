import Link from 'next/link';
import type { Tutorial } from '@/lib/cms/types';
import { readingTime } from '@/lib/cms/markdown';
import { formatDate } from '@/lib/cms/format';
import { DifficultyBadge, DistroBadge, NeutralBadge } from './Badges';

export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  const minutes = readingTime(tutorial.content);
  return (
    <Link
      href={`/linux-tutorials/${tutorial.slug}`}
      className="card group flex h-full flex-col overflow-hidden p-0 transition hover:border-brand-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:border-brand-700"
      aria-label={`Read tutorial: ${tutorial.title}`}
    >
      {tutorial.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tutorial.coverImage}
          alt=""
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <DifficultyBadge value={tutorial.difficulty} />
          <DistroBadge value={tutorial.distribution} />
          {tutorial.category && <NeutralBadge>{tutorial.category.name}</NeutralBadge>}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
          {tutorial.title}
        </h3>
        <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
          {tutorial.summary}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          {tutorial.publishedAt && <span>{formatDate(tutorial.publishedAt)}</span>}
          <span aria-hidden="true">·</span>
          <span>{minutes} min read</span>
        </div>
      </div>
    </Link>
  );
}
