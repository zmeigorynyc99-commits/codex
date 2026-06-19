'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/cms/client';
import { ConfirmDialog } from './ConfirmDialog';
import { formatDate } from '@/lib/cms/format';
import type { Tutorial } from '@/lib/cms/types';

export function TutorialsTable({ tutorials }: { tutorials: Tutorial[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Tutorial | null>(null);

  async function toggleStatus(t: Tutorial) {
    setBusy(t.id);
    await apiFetch(`/api/admin/tutorials/${t.id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: t.status === 'published' ? 'draft' : 'published' }),
    });
    setBusy(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(toDelete.id);
    await apiFetch(`/api/admin/tutorials/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    setBusy(null);
    router.refresh();
  }

  if (tutorials.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
        No tutorials yet. <Link href="/admin/tutorials/new" className="text-brand-700 hover:underline dark:text-brand-300">Create your first one</Link>.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tutorials.map((t) => (
              <tr key={t.id} className="bg-white dark:bg-slate-950">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900 dark:text-white">{t.title}</span>
                  {t.featured && <span className="ml-2 text-xs text-amber-600">★ featured</span>}
                  <span className="block text-xs text-slate-400">/{t.slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${t.status === 'published' ? 'badge-difficulty-beginner' : 'badge-neutral'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(t.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/admin/tutorials/${t.id}/edit`} className="btn-secondary !px-2 !py-1 text-xs">Edit</Link>
                    <Link href={`/admin/tutorials/${t.id}/preview`} className="btn-secondary !px-2 !py-1 text-xs">Preview</Link>
                    <button
                      type="button"
                      onClick={() => toggleStatus(t)}
                      disabled={busy === t.id}
                      className="btn-secondary !px-2 !py-1 text-xs"
                    >
                      {t.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(t)}
                      disabled={busy === t.id}
                      className="btn !inline-flex !px-2 !py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete tutorial?"
        message={`“${toDelete?.title ?? ''}” will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
