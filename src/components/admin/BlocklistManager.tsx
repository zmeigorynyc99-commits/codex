'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/cms/client';
import type { BlockedIp } from '@/lib/cms/blocklist';

export function BlocklistManager({ blocked }: { blocked: BlockedIp[] }) {
  const router = useRouter();
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await apiFetch<{ error?: string }>('/api/admin/blocklist', {
      method: 'POST',
      body: JSON.stringify({ ip, reason }),
    });
    setBusy(false);
    if (result.ok) {
      setIp('');
      setReason('');
      router.refresh();
    } else {
      setError(result.data?.error ?? 'Could not block this IP.');
    }
  }

  async function unblock(target: string) {
    setBusy(true);
    await apiFetch('/api/admin/blocklist', { method: 'POST', body: JSON.stringify({ ip: target, action: 'unblock' }) });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label htmlFor="bl-ip" className="label">IP address</label>
          <input id="bl-ip" className="input font-mono" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.5" required />
        </div>
        <div className="flex-1">
          <label htmlFor="bl-reason" className="label">Reason (optional)</label>
          <input id="bl-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
        </div>
        <button type="submit" disabled={busy} className="btn-primary">Block IP</button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {blocked.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          No IPs are blocked.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {blocked.map((b) => (
            <li key={b.ip} className="flex items-center justify-between gap-3 bg-white p-4 dark:bg-slate-900">
              <div className="min-w-0">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{b.ip}</span>
                {b.reason && <span className="ml-2 text-sm text-slate-500">{b.reason}</span>}
              </div>
              <button type="button" onClick={() => unblock(b.ip)} disabled={busy} className="btn-secondary !px-3 !py-1 text-xs">
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
