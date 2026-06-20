'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/cms/client';

export interface ModAction {
  action: string;
  label: string;
  danger?: boolean;
  confirm?: string;
}

/** Renders moderation buttons that POST to /api/admin/moderation and refresh. */
export function ModerationActions({
  entity,
  id,
  actions,
}: {
  entity: 'thread' | 'reply' | 'comment' | 'message';
  id: number;
  actions: ModAction[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(a: ModAction) {
    if (a.confirm && !window.confirm(a.confirm)) return;
    setBusy(true);
    await apiFetch('/api/admin/moderation', {
      method: 'POST',
      body: JSON.stringify({ entity, id, action: a.action }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <button
          key={a.action}
          type="button"
          disabled={busy}
          onClick={() => run(a)}
          className={`rounded px-2 py-1 text-xs font-medium ${
            a.danger
              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
