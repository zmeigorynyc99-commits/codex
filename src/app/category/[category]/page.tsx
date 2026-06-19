import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, getCategory, getToolsByCategory, type CategoryId } from '@/lib/tools';
import { absoluteUrl } from '@/lib/site';
import { ToolCard } from '@/components/ToolCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.id }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const category = getCategory(params.category as CategoryId);
  if (!category) return {};
  return {
    title: `${category.name} — free online tools`,
    description: category.description,
    alternates: { canonical: absoluteUrl(`/category/${category.id}`) },
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category as CategoryId);
  if (!category) notFound();
  const tools = getToolsByCategory(category.id);

  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: category.name }]} />
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden="true">{category.icon}</span>
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{category.description}</p>
        </div>
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}
