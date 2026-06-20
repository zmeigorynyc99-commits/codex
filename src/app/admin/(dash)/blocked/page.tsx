import { listBlocked } from '@/lib/cms/blocklist';
import { BlocklistManager } from '@/components/admin/BlocklistManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blocked IPs' };

export default function BlockedIpsPage() {
  const blocked = listBlocked();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Blocked IPs</h1>
      <p className="mb-6 text-sm text-slate-500">
        Blocked addresses cannot post or browse the site. You can also block an IP directly from any
        comment, forum post or message using its “Block” button.
      </p>
      <BlocklistManager blocked={blocked} />
    </div>
  );
}
