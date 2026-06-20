import { listMessages } from '@/lib/cms/messages';
import { formatDate } from '@/lib/cms/format';
import { ModerationActions } from '@/components/admin/ModerationActions';
import { BlockIpButton } from '@/components/admin/BlockIpButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inbox' };

export default function InboxPage() {
  const messages = listMessages();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Inbox</h1>
      <p className="mb-6 text-sm text-slate-500">
        Contact messages and questions submitted from the site. {messages.filter((m) => m.status === 'new').length} new.
      </p>

      {messages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          No messages yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border p-4 ${
                m.status === 'new'
                  ? 'border-brand-300 bg-brand-50/40 dark:border-brand-900 dark:bg-brand-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`badge ${m.kind === 'question' ? 'badge-distro' : 'badge-neutral'}`}>{m.kind}</span>
                  <span className="badge badge-neutral">{m.status}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{m.subject}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                From <span className="font-medium">{m.name}</span>
                {m.contact ? ` · reach back: ${m.contact}` : ''}
              </p>
              <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{m.body}</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <ModerationActions
                  entity="message"
                  id={m.id}
                  actions={[
                    { action: 'read', label: 'Mark read' },
                    { action: 'archived', label: 'Archive' },
                    { action: 'new', label: 'Mark new' },
                    { action: 'delete', label: 'Delete', danger: true, confirm: 'Delete this message permanently?' },
                  ]}
                />
                <BlockIpButton ip={m.ipAddress} reason={`message: ${m.subject}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
