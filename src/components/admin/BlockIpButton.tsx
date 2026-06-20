'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/cms/client';

/** Inline "Block IP" control shown next to a submission's IP in admin views. */
export function BlockIpButton({ ip, reason }: { ip: string | null; reason?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!ip) return <span className="text-xs text-slate-400">no IP</span>;

  async function block() {
    if (!window.confirm(`Block IP ${ip}? They will be unable to post or browse the site.`)) return;
    setBusy(true);
    await apiFetch('/api/admin/blocklist', { method: 'POST', body: JSON.stringify({ ip, reason }) });
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs text-slate-400">{ip}</span>
      <button
        type="button"
        onClick={block}
        disabled={busy}
        className="rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
      >
        Block
      </button>
    </span>
  );
}
