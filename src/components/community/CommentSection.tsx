'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postPublic } from '@/lib/cms/public-client';
import { UGC_LIMITS } from '@/lib/cms/community';
import { formatDate } from '@/lib/cms/format';
import { Honeypot } from './Honeypot';

interface CommentView {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export function CommentSection({
  tutorialId,
  comments,
}: {
  tutorialId: number;
  comments: CommentView[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'pending' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 2) {
      setError('Please write a longer comment.');
      return;
    }
    setStatus('sending');
    setError('');
    const result = await postPublic(`/api/tutorials/${tutorialId}/comments`, {
      authorName: name,
      body,
      website,
    });
    if (result.ok) {
      setBody('');
      setName('');
      if (result.pending) {
        setStatus('pending');
      } else {
        setStatus('done');
        router.refresh();
      }
    } else {
      setStatus('error');
      setError(result.error ?? 'Could not post your comment.');
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
      <h2 id="comments-heading" className="text-xl font-bold">
        Comments {comments.length > 0 && <span className="text-slate-400">({comments.length})</span>}
      </h2>

      <ul className="mt-4 space-y-4">
        {comments.length === 0 && (
          <li className="text-sm text-slate-500">Be the first to comment.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">{c.authorName}</span>
              <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
            </div>
            {/* React escapes this text — no HTML/scripts can be injected. */}
            <div className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{c.body}</div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="card mt-6 space-y-3">
        <h3 className="font-semibold">Leave a comment</h3>
        {status === 'pending' && (
          <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            Thanks! Your comment was received and is awaiting review before it appears.
          </p>
        )}
        {status === 'done' && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
            Your comment was posted.
          </p>
        )}
        <Honeypot value={website} onChange={setWebsite} />
        <div>
          <label htmlFor="c-name" className="label">Name (optional)</label>
          <input id="c-name" className="input" value={name} maxLength={UGC_LIMITS.name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" />
        </div>
        <div>
          <label htmlFor="c-body" className="label">Comment</label>
          <textarea id="c-body" className="input" rows={4} value={body} maxLength={UGC_LIMITS.commentBody} onChange={(e) => setBody(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={status === 'sending'} className="btn-primary">
          {status === 'sending' ? 'Posting…' : 'Post comment'}
        </button>
        <p className="text-xs text-slate-400">
          Be respectful. Comments are plain text — links and HTML are not rendered. Spam is removed.
        </p>
      </form>
    </section>
  );
}
