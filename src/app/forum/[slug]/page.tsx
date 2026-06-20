import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absoluteUrl } from '@/lib/site';
import { getThreadBySlug, listReplies } from '@/lib/cms/forum';
import { formatDate } from '@/lib/cms/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { UserText } from '@/components/community/UserText';
import { ForumReplyForm } from '@/components/community/ForumReplyForm';
import { SupportCta } from '@/components/community/SupportCta';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const thread = getThreadBySlug(params.slug, { publicOnly: true });
  if (!thread) return { title: 'Discussion not found', robots: { index: false, follow: false } };
  const description = thread.body.slice(0, 160);
  return {
    title: `${thread.title} — Forum`,
    description,
    alternates: { canonical: absoluteUrl(`/forum/${thread.slug}`) },
    openGraph: { type: 'article', url: absoluteUrl(`/forum/${thread.slug}`), title: thread.title, description },
  };
}

export default function ThreadPage({ params }: { params: { slug: string } }) {
  const thread = getThreadBySlug(params.slug, { publicOnly: true });
  if (!thread) notFound();
  const replies = listReplies(thread.id, { publicOnly: true });

  return (
    <div className="container-content py-8">
      <Breadcrumbs
        items={[{ name: 'Home', href: '/' }, { name: 'Forum', href: '/forum' }, { name: thread.title }]}
      />

      <article className="mx-auto max-w-3xl">
        <header>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {thread.pinned && <span className="badge badge-distro">Pinned</span>}
            {thread.locked && <span className="badge badge-neutral">Locked</span>}
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">{thread.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Started by <span className="font-medium text-slate-700 dark:text-slate-300">{thread.authorName}</span> · {formatDate(thread.createdAt)}
          </p>
        </header>

        <div className="card mt-5">
          <UserText text={thread.body} className="text-slate-700 dark:text-slate-300" />
        </div>

        <section aria-label="Replies" className="mt-8">
          <h2 className="text-lg font-bold">
            {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}
          </h2>
          <ul className="mt-4 space-y-4">
            {replies.map((reply) => (
              <li key={reply.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{reply.authorName}</span>
                  <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
                </div>
                <UserText text={reply.body} className="text-sm text-slate-700 dark:text-slate-300" />
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <ForumReplyForm threadId={thread.id} locked={thread.locked} />
          </div>
        </section>

        <div className="mt-10">
          <SupportCta />
        </div>
      </article>
    </div>
  );
}
