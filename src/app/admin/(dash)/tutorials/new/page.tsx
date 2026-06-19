import { listCategories } from '@/lib/cms/tutorials';
import { TutorialEditor } from '@/components/admin/TutorialEditor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'New tutorial' };

export default function NewTutorialPage() {
  const categories = listCategories();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New tutorial</h1>
      <TutorialEditor tutorial={null} categories={categories} />
    </div>
  );
}
