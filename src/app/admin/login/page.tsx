import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/cms/session';
import { LoginForm } from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({ searchParams }: { searchParams: { next?: string } }) {
  if (getCurrentAdmin()) {
    redirect(searchParams.next && searchParams.next.startsWith('/admin') ? searchParams.next : '/admin');
  }
  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold">Admin sign in</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Tutorials management</p>
        <LoginForm next={searchParams.next} />
      </div>
    </div>
  );
}
