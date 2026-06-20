import Link from 'next/link';
import { listCommentsForModeration } from '@/lib/cms/comments';
import { formatDate } from '@/lib/cms/format';
import { ModerationActions } from '@/components/admin/ModerationActions';
import { BlockIpButton } from '@/components/admin/BlockIpButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Comment moderation' };

export default function CommentsModerationPage() {
  const comments = listCommentsForModeration();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Comment moderation</h1>
      <p className="mb-6 text-sm text-slate-500">
        {comments.length} recent comments · {comments.filter((c) => c.status === 'pending').length} pending review
      </p>

      {comments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`badge ${c.status === 'approved' ? 'badge-difficulty-beginner' : c.status === 'pending' ? 'badge-difficulty-intermediate' : 'badge-neutral'}`}>{c.status}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{c.authorName}</span>
                  <span className="text-xs text-slate-400">on</span>
                  <Link href={`/linux-tutorials/${c.tutorialSlug}`} className="text-xs text-brand-700 hover:underline dark:text-brand-300">{c.tutorialTitle}</Link>
                </div>
                <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
              </div>
              <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">{c.body}</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <ModerationActions
                  entity="comment"
                  id={c.id}
                  actions={[
                    { action: 'approve', label: 'Approve' },
                    { action: 'hide', label: 'Hide' },
                    { action: 'delete', label: 'Delete', danger: true, confirm: 'Delete this comment?' },
                  ]}
                />
                <BlockIpButton ip={c.ipAddress} reason={`comment on ${c.tutorialTitle}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
