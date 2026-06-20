import Link from 'next/link';
import { overview, topIps, topTutorials, recentRequests } from '@/lib/cms/analytics';
import { topLiked } from '@/lib/cms/likes';
import { formatDate } from '@/lib/cms/format';
import { BlockIpButton } from '@/components/admin/BlockIpButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Statistics' };

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-2xl font-bold text-brand-700 dark:text-brand-300">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function time(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export default function StatsPage() {
  const stats = overview();
  const ips = topIps(100);
  const tutorials = topTutorials(20);
  const liked = topLiked(10);
  const requests = recentRequests(200);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-1 text-2xl font-bold">Statistics</h1>
        <p className="mb-4 text-sm text-slate-500">
          Privacy-friendly, first-party analytics from your own server. No third-party trackers.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Total page views" value={stats.totalViews} />
          <Card label="Unique visitors" value={stats.uniqueVisitors} />
          <Card label="Views (24h)" value={stats.viewsToday} />
          <Card label="Visitors (24h)" value={stats.visitorsToday} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top tutorials</h2>
        {tutorials.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">No tutorial views yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr><th className="px-4 py-2">Tutorial</th><th className="px-4 py-2 text-right">Views</th><th className="px-4 py-2 text-right">Visitors</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tutorials.map((t) => (
                  <tr key={t.slug} className="bg-white dark:bg-slate-950">
                    <td className="px-4 py-2">
                      <Link href={`/linux-tutorials/${t.slug}`} className="text-brand-700 hover:underline dark:text-brand-300">{t.title ?? t.slug}</Link>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{t.views.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono">{t.visitors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {liked.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Most liked</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {liked.map((t) => (
              <li key={t.slug} className="flex items-center justify-between bg-white p-3 text-sm dark:bg-slate-900">
                <Link href={`/linux-tutorials/${t.slug}`} className="text-brand-700 hover:underline dark:text-brand-300">{t.title ?? t.slug}</Link>
                <span className="font-mono">👍 {t.likes}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top 100 IP addresses</h2>
        {ips.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">No traffic recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr><th className="px-4 py-2">IP</th><th className="px-4 py-2 text-right">Hits</th><th className="px-4 py-2">Last seen</th><th className="px-4 py-2 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ips.map((row) => (
                  <tr key={row.ip} className="bg-white dark:bg-slate-950">
                    <td className="px-4 py-2 font-mono">{row.ip}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.hits.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-500">{time(row.lastSeen)}</td>
                    <td className="px-4 py-2 text-right">
                      {row.blocked ? (
                        <span className="badge badge-difficulty-advanced">blocked</span>
                      ) : (
                        <BlockIpButton ip={row.ip} reason="high traffic / abuse" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent requests (last {requests.length})</h2>
        <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-left uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">IP</th><th className="px-3 py-2">Path</th><th className="px-3 py-2 text-right">Block</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono dark:divide-slate-800">
              {requests.map((r) => (
                <tr key={r.id} className="bg-white dark:bg-slate-950">
                  <td className="whitespace-nowrap px-3 py-1.5 text-slate-500">{time(r.createdAt)}</td>
                  <td className="px-3 py-1.5">{r.ip ?? '—'}</td>
                  <td className="max-w-[24rem] truncate px-3 py-1.5">{r.path}</td>
                  <td className="px-3 py-1.5 text-right">{r.ip ? <BlockIpButton ip={r.ip} reason={`request to ${r.path}`} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Raw web-server logs are also available on the server with
          <code className="mx-1 rounded bg-slate-100 px-1 dark:bg-slate-800">docker compose logs nginx</code>
          and <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">docker compose logs web</code>.
        </p>
      </section>
    </div>
  );
}
