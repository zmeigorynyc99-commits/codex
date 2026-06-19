import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/cms/session';
import { LogoutButton } from '@/components/admin/LogoutButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = requireAdmin('/admin');

  return (
    <div className="container-content py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <nav className="flex items-center gap-4 text-sm font-medium" aria-label="Admin">
          <Link href="/admin" className="text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
            Dashboard
          </Link>
          <Link href="/admin/tutorials/new" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
            New tutorial
          </Link>
          <Link href="/linux-tutorials" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
            View site
          </Link>
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
