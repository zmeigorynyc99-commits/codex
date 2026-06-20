import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absoluteUrl } from '@/lib/site';
import { getTutorialBySlug, getAdjacent, getRelated } from '@/lib/cms/tutorials';
import { readingTime, extractToc } from '@/lib/cms/markdown';
import { tutorialMetadata, tutorialJsonLd, tutorialBreadcrumbJsonLd } from '@/lib/cms/seo';
import { formatDate } from '@/lib/cms/format';
import { TutorialContent } from '@/components/cms/TutorialContent';
import { TableOfContents } from '@/components/cms/TableOfContents';
import { ShareButtons } from '@/components/cms/ShareButtons';
import { DifficultyBadge, DistroBadge, NeutralBadge } from '@/components/cms/Badges';
import { TutorialCard } from '@/components/cms/TutorialCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { listComments } from '@/lib/cms/comments';
import { CommentSection } from '@/components/community/CommentSection';
import { SupportCta } from '@/components/community/SupportCta';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tutorial = getTutorialBySlug(params.slug, { publishedOnly: true });
  if (!tutorial) return { title: 'Tutorial not found', robots: { index: false, follow: false } };
  return tutorialMetadata(tutorial);
}

export default function TutorialPage({ params }: { params: { slug: string } }) {
  const tutorial = getTutorialBySlug(params.slug, { publishedOnly: true });
  if (!tutorial) notFound();

  const minutes = readingTime(tutorial.content);
  const toc = extractToc(tutorial.content);
  const { prev, next } = getAdjacent(tutorial);
  const related = getRelated(tutorial, 3);
  const comments = listComments(tutorial.id, { publicOnly: true });
  const url = absoluteUrl(`/linux-tutorials/${tutorial.slug}`);

  return (
    <div className="container-content py-8">
      <JsonLd data={tutorialJsonLd(tutorial)} />
      <JsonLd data={tutorialBreadcrumbJsonLd(tutorial)} />

      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Linux Tutorials', href: '/linux-tutorials' },
          { name: tutorial.title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="min-w-0">
          <header>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <DifficultyBadge value={tutorial.difficulty} />
              <DistroBadge value={tutorial.distribution} />
              {tutorial.category && (
                <Link href={`/linux-tutorials?category=${tutorial.category.slug}`}>
                  <NeutralBadge>{tutorial.category.name}</NeutralBadge>
                </Link>
              )}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">{tutorial.title}</h1>
            {tutorial.summary && (
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{tutorial.summary}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {tutorial.author && <span>By {tutorial.author}</span>}
              {tutorial.publishedAt && (
                <span>Published {formatDate(tutorial.publishedAt)}</span>
              )}
              {tutorial.updatedAt && tutorial.updatedAt !== tutorial.publishedAt && (
                <span>Updated {formatDate(tutorial.updatedAt)}</span>
              )}
              <span>{minutes} min read</span>
            </div>
          </header>

          {tutorial.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tutorial.coverImage}
              alt=""
              className="mt-6 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-800"
            />
          )}

          <div className="mt-6 lg:hidden">
            <TableOfContents items={toc} />
          </div>

          <div className="mt-6">
            <TutorialContent markdown={tutorial.content} />
          </div>

          {tutorial.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tags:</span>
              {tutorial.tags.map((tag) => (
                <Link key={tag.id} href={`/linux-tutorials?tag=${tag.slug}`}>
                  <NeutralBadge>#{tag.name}</NeutralBadge>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <ShareButtons url={url} title={tutorial.title} />
          </div>

          {(prev || next) && (
            <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Tutorial navigation">
              {prev ? (
                <Link href={`/linux-tutorials/${prev.slug}`} className="card hover:shadow-md">
                  <span className="text-xs text-slate-400">← Previous</span>
                  <span className="mt-1 block font-medium text-slate-900 dark:text-white">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/linux-tutorials/${next.slug}`} className="card text-right hover:shadow-md">
                  <span className="text-xs text-slate-400">Next →</span>
                  <span className="mt-1 block font-medium text-slate-900 dark:text-white">{next.title}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          <div className="mt-10">
            <SupportCta />
          </div>

          <CommentSection tutorialId={tutorial.id} comments={comments} />
        </article>

        <aside className="space-y-6">
          <div className="hidden lg:block lg:sticky lg:top-20">
            <TableOfContents items={toc} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12">
          <h2 id="related-heading" className="mb-4 text-xl font-bold">Related tutorials</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
