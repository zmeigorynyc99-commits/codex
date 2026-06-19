import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTutorialById, listCategories } from '@/lib/cms/tutorials';
import { TutorialEditor } from '@/components/admin/TutorialEditor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Edit tutorial' };

export default function EditTutorialPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const tutorial = getTutorialById(id);
  if (!tutorial) notFound();
  const categories = listCategories();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit tutorial</h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Back to dashboard</Link>
      </div>
      <TutorialEditor tutorial={tutorial} categories={categories} />
    </div>
  );
}
