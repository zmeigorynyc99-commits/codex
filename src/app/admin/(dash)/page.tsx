import Link from 'next/link';
import { listTutorials } from '@/lib/cms/tutorials';
import { TutorialsTable } from '@/components/admin/TutorialsTable';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const drafts = listTutorials({ status: 'draft', orderBy: 'updated', pageSize: 50 });
  const published = listTutorials({ status: 'published', orderBy: 'updated', pageSize: 50 });
  const all = [...drafts.items, ...published.items];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tutorials</h1>
          <p className="text-sm text-slate-500">
            {published.total} published · {drafts.total} draft{drafts.total === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/admin/tutorials/new" className="btn-primary">+ New tutorial</Link>
      </div>
      <TutorialsTable tutorials={all} />
    </div>
  );
}
