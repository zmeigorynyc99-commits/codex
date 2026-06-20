'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postPublic } from '@/lib/cms/public-client';
import { UGC_LIMITS } from '@/lib/cms/community';
import { Honeypot } from './Honeypot';

export function ForumNewThread() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return setError('Please enter a longer title.');
    if (body.trim().length < 5) return setError('Please write a longer message.');
    setSending(true);
    setError('');
    const result = await postPublic('/api/forum/threads', { title, authorName: name, body, website });
    setSending(false);
    if (result.ok) {
      if (result.pending) {
        setPending(true);
        setOpen(false);
      } else if (result.slug) {
        router.push(`/forum/${result.slug}`);
      } else {
        router.refresh();
      }
    } else {
      setError(result.error ?? 'Could not start the discussion.');
    }
  }

  if (!open) {
    return (
      <div>
        {pending && (
          <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            Thanks! Your topic was received and is awaiting review before it appears.
          </p>
        )}
        <button type="button" onClick={() => setOpen(true)} className="btn-primary">
          + Start a discussion
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-semibold">Start a discussion</h2>
      <Honeypot value={website} onChange={setWebsite} />
      <div>
        <label htmlFor="t-title" className="label">Title</label>
        <input id="t-title" className="input" value={title} maxLength={UGC_LIMITS.threadTitle} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="t-name" className="label">Your name (optional)</label>
        <input id="t-name" className="input" value={name} maxLength={UGC_LIMITS.name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" />
      </div>
      <div>
        <label htmlFor="t-body" className="label">Message</label>
        <textarea id="t-body" className="input" rows={6} value={body} maxLength={UGC_LIMITS.threadBody} onChange={(e) => setBody(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={sending} className="btn-primary">{sending ? 'Posting…' : 'Post'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
      </div>
      <p className="text-xs text-slate-400">Plain text only — links and HTML are not rendered. Be respectful; spam is removed.</p>
    </form>
  );
}
