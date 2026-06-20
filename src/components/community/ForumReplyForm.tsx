'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postPublic } from '@/lib/cms/public-client';
import { UGC_LIMITS } from '@/lib/cms/community';
import { Honeypot } from './Honeypot';

export function ForumReplyForm({ threadId, locked }: { threadId: number; locked: boolean }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (locked) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        This thread is locked. New replies are disabled.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 2) return setError('Please write a longer reply.');
    setSending(true);
    setError('');
    const result = await postPublic(`/api/forum/threads/${threadId}/replies`, { authorName: name, body, website });
    setSending(false);
    if (result.ok) {
      setBody('');
      setName('');
      if (result.pending) setPending(true);
      else router.refresh();
    } else {
      setError(result.error ?? 'Could not post your reply.');
    }
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-3">
      <h3 className="font-semibold">Reply</h3>
      {pending && (
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Thanks! Your reply is awaiting review before it appears.
        </p>
      )}
      <Honeypot value={website} onChange={setWebsite} />
      <div>
        <label htmlFor="r-name" className="label">Name (optional)</label>
        <input id="r-name" className="input" value={name} maxLength={UGC_LIMITS.name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" />
      </div>
      <div>
        <label htmlFor="r-body" className="label">Your reply</label>
        <textarea id="r-body" className="input" rows={4} value={body} maxLength={UGC_LIMITS.replyBody} onChange={(e) => setBody(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={sending} className="btn-primary">{sending ? 'Posting…' : 'Post reply'}</button>
    </form>
  );
}
