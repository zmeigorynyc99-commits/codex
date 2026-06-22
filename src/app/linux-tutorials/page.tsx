import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl, siteConfig } from '@/lib/site';
import { listCourseLessons, listCategories, type CourseFilters } from '@/lib/cms/tutorials';
import { isDifficulty, isDistribution } from '@/lib/cms/constants';
import { readingTime } from '@/lib/cms/markdown';
import { formatDate } from '@/lib/cms/format';
import { LessonCarousel, type LessonCardData } from '@/components/cms/LessonCarousel';
import { TutorialFilters } from '@/components/cms/TutorialFilters';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Linux Tutorials — the ordered course, lesson by lesson',
  description:
    'The complete Linux-to-DevOps course as one ordered sequence: swipe through every lesson in numerical order, from the first lesson to the last. Filter by category, difficulty and distribution.',
  alternates: {
    canonical: absoluteUrl('/linux-tutorials'),
    types: { 'application/rss+xml': absoluteUrl('/linux-tutorials/rss.xml') },
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/linux-tutorials'),
    title: `Linux Tutorials · ${siteConfig.name}`,
    description: 'The complete Linux-to-DevOps course as one ordered, swipeable sequence of lessons.',
  },
};

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

export default function LinuxTutorialsPage({ searchParams }: PageProps) {
  const filters: CourseFilters = {
    search: searchParams.q,
    category: searchParams.category,
    difficulty: isDifficulty(searchParams.difficulty) ? searchParams.difficulty : undefined,
    distribution: isDistribution(searchParams.distribution) ? searchParams.distribution : undefined,
  };

  const hasFilters = Boolean(
    searchParams.q || searchParams.category || searchParams.difficulty || searchParams.distribution,
  );

  // Canonical, de-duplicated, numerically-ordered course sequence.
  const lessons = listCourseLessons(filters);
  const categories = listCategories();

  const cards: LessonCardData[] = lessons.map((t) => ({
    slug: t.slug,
    title: t.title,
    summary: t.summary,
    coverImage: t.coverImage,
    difficulty: t.difficulty,
    distribution: t.distribution,
    categoryName: t.category?.name ?? null,
    dateLabel: t.publishedAt ? formatDate(t.publishedAt) : null,
    minutes: readingTime(t.content),
  }));

  return (
    <div className="container-content py-10">
      {/* Atmospheric backdrop (penguin on the right, dark on the left for text). */}
      <div aria-hidden="true" className="lessons-backdrop pointer-events-none fixed inset-0 -z-10" />
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Linux Tutorials' }]} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Linux Tutorials</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            The complete course as one ordered corridor — swipe, drag or use the arrows to move
            from the first lesson to the last.
          </p>
        </div>
        <a href="/linux-tutorials/rss.xml" className="btn-secondary text-sm" aria-label="Subscribe via RSS">
          RSS feed
        </a>
      </div>

      <div className="mt-6">
        <TutorialFilters categories={categories} />
      </div>

      <div className="mt-8">
        <h2 className="sr-only">Lessons</h2>
        {cards.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            No lessons found.{' '}
            {hasFilters && (
              <Link href="/linux-tutorials" className="text-brand-700 hover:underline dark:text-brand-300">
                Clear filters
              </Link>
            )}
          </p>
        ) : (
          <LessonCarousel lessons={cards} />
        )}
      </div>
    </div>
  );
}
