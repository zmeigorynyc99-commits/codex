'use client';

import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/cms/client';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await apiFetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} className="btn-secondary !py-1.5 text-sm">
      Sign out
    </button>
  );
}
