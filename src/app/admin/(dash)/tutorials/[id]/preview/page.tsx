import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTutorialById } from '@/lib/cms/tutorials';
import { readingTime, extractToc } from '@/lib/cms/markdown';
import { formatDate } from '@/lib/cms/format';
import { TutorialContent } from '@/components/cms/TutorialContent';
import { TableOfContents } from '@/components/cms/TableOfContents';
import { DifficultyBadge, DistroBadge, NeutralBadge } from '@/components/cms/Badges';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Preview', robots: { index: false, follow: false } };

export default function PreviewPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const tutorial = getTutorialById(id);
  if (!tutorial) notFound();

  const toc = extractToc(tutorial.content);
  const minutes = readingTime(tutorial.content);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/30">
        <span className="font-medium text-amber-800 dark:text-amber-300">
          Preview — {tutorial.status === 'published' ? 'published' : 'draft (not public)'}
        </span>
        <div className="flex gap-3">
          <Link href={`/admin/tutorials/${id}/edit`} className="text-brand-700 hover:underline dark:text-brand-300">Edit</Link>
          <Link href="/admin" className="text-slate-500 hover:underline">Dashboard</Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <DifficultyBadge value={tutorial.difficulty} />
          <DistroBadge value={tutorial.distribution} />
          {tutorial.category && <NeutralBadge>{tutorial.category.name}</NeutralBadge>}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{tutorial.title}</h1>
        {tutorial.summary && <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{tutorial.summary}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          {tutorial.author && <span>By {tutorial.author}</span>}
          <span>{tutorial.publishedAt ? formatDate(tutorial.publishedAt) : 'Not published'}</span>
          <span>{minutes} min read</span>
        </div>

        {tutorial.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tutorial.coverImage} alt="" className="mt-6 w-full rounded-xl border border-slate-200 dark:border-slate-800" />
        )}

        <div className="mt-6">
          <TableOfContents items={toc} />
        </div>
        <div className="mt-6">
          <TutorialContent markdown={tutorial.content} />
        </div>
      </article>
    </div>
  );
}
