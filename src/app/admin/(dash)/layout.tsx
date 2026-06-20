import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/cms/session';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { countNewMessages } from '@/lib/cms/messages';
import { countThreadsByStatus } from '@/lib/cms/forum';
import { countCommentsByStatus } from '@/lib/cms/comments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
      {n}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = requireAdmin('/admin');
  const newMessages = countNewMessages();
  const pendingThreads = countThreadsByStatus('pending');
  const pendingComments = countCommentsByStatus('pending');

  const link = 'text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300';

  return (
    <div className="container-content py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium" aria-label="Admin">
          <Link href="/admin" className="text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
            Tutorials
          </Link>
          <Link href="/admin/tutorials/new" className={link}>New</Link>
          <Link href="/admin/comments" className={link}>
            Comments<Count n={pendingComments} />
          </Link>
          <Link href="/admin/forum" className={link}>
            Forum<Count n={pendingThreads} />
          </Link>
          <Link href="/admin/inbox" className={link}>
            Inbox<Count n={newMessages} />
          </Link>
          <Link href="/" className={link}>View site</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden sm:inline">{admin.email}</span>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
