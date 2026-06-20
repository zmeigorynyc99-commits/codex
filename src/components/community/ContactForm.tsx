'use client';

import { useState } from 'react';
import { postPublic } from '@/lib/cms/public-client';
import { UGC_LIMITS } from '@/lib/cms/community';
import { Honeypot } from './Honeypot';

export function ContactForm({ defaultKind = 'contact' }: { defaultKind?: 'contact' | 'question' }) {
  const [kind, setKind] = useState<'contact' | 'question'>(defaultKind);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 5) return setError('Please write a longer message.');
    setSending(true);
    setError('');
    const result = await postPublic('/api/contact', { kind, name, contact, subject, body, website });
    setSending(false);
    if (result.ok) {
      setDone(true);
      setName(''); setContact(''); setSubject(''); setBody('');
    } else {
      setError(result.error ?? 'Could not send your message.');
    }
  }

  if (done) {
    return (
      <div className="card text-center">
        <p className="text-lg font-semibold text-green-700 dark:text-green-400">Message sent ✓</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Thanks for reaching out. Your message has been delivered to the site owner and will be reviewed.
        </p>
        <button type="button" onClick={() => setDone(false)} className="btn-secondary mt-4">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="flex gap-2" role="group" aria-label="Message type">
        {(['contact', 'question'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
              kind === k
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {k === 'contact' ? 'Send a message' : 'Ask a question'}
          </button>
        ))}
      </div>

      <Honeypot value={website} onChange={setWebsite} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-name" className="label">Name (optional)</label>
          <input id="m-name" className="input" value={name} maxLength={UGC_LIMITS.name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" />
        </div>
        <div>
          <label htmlFor="m-contact" className="label">How to reach you back (optional)</label>
          <input id="m-contact" className="input" value={contact} maxLength={UGC_LIMITS.contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. a forum handle" />
        </div>
      </div>
      <div>
        <label htmlFor="m-subject" className="label">Subject (optional)</label>
        <input id="m-subject" className="input" value={subject} maxLength={UGC_LIMITS.subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div>
        <label htmlFor="m-body" className="label">{kind === 'question' ? 'Your question' : 'Your message'}</label>
        <textarea id="m-body" className="input" rows={6} value={body} maxLength={UGC_LIMITS.messageBody} onChange={(e) => setBody(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={sending} className="btn-primary">
        {sending ? 'Sending…' : kind === 'question' ? 'Ask question' : 'Send message'}
      </button>
      <p className="text-xs text-slate-400">
        No email required. Your message is delivered privately to the site owner inside the admin area.
      </p>
    </form>
  );
}
