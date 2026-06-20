import Link from 'next/link';
import { listThreads, listRepliesForModeration } from '@/lib/cms/forum';
import { formatDate } from '@/lib/cms/format';
import { ModerationActions } from '@/components/admin/ModerationActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forum moderation' };

export default function ForumModerationPage() {
  const threads = listThreads({ pageSize: 50 }).items;
  const replies = listRepliesForModeration();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-1 text-2xl font-bold">Forum moderation</h1>
        <p className="mb-6 text-sm text-slate-500">{threads.length} threads · {replies.length} recent replies</p>

        <h2 className="mb-3 text-lg font-semibold">Threads</h2>
        {threads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">No threads.</p>
        ) : (
          <ul className="space-y-3">
            {threads.map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${t.status === 'approved' ? 'badge-difficulty-beginner' : t.status === 'pending' ? 'badge-difficulty-intermediate' : 'badge-neutral'}`}>{t.status}</span>
                    {t.pinned && <span className="badge badge-distro">pinned</span>}
                    {t.locked && <span className="badge badge-neutral">locked</span>}
                    <Link href={`/forum/${t.slug}`} className="font-semibold text-slate-900 hover:underline dark:text-white">{t.title}</Link>
                  </div>
                  <span className="text-xs text-slate-400">{t.authorName} · {formatDate(t.createdAt)}</span>
                </div>
                <div className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">{t.body}</div>
                <div className="mt-3">
                  <ModerationActions
                    entity="thread"
                    id={t.id}
                    actions={[
                      { action: 'approve', label: 'Approve' },
                      { action: 'hide', label: 'Hide' },
                      { action: t.pinned ? 'unpin' : 'pin', label: t.pinned ? 'Unpin' : 'Pin' },
                      { action: t.locked ? 'unlock' : 'lock', label: t.locked ? 'Unlock' : 'Lock' },
                      { action: 'delete', label: 'Delete', danger: true, confirm: 'Delete this thread and all replies?' },
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent replies</h2>
        {replies.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">No replies.</p>
        ) : (
          <ul className="space-y-3">
            {replies.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${r.status === 'approved' ? 'badge-difficulty-beginner' : r.status === 'pending' ? 'badge-difficulty-intermediate' : 'badge-neutral'}`}>{r.status}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{r.authorName}</span>
                    <span className="text-xs text-slate-400">on</span>
                    <Link href={`/forum/${r.threadSlug}`} className="text-xs text-brand-700 hover:underline dark:text-brand-300">{r.threadTitle}</Link>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">{r.body}</div>
                <div className="mt-3">
                  <ModerationActions
                    entity="reply"
                    id={r.id}
                    actions={[
                      { action: 'approve', label: 'Approve' },
                      { action: 'hide', label: 'Hide' },
                      { action: 'delete', label: 'Delete', danger: true, confirm: 'Delete this reply?' },
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
