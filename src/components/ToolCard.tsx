import Link from 'next/link';
import { getCategory, type ToolDefinition } from '@/lib/tools';

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const category = getCategory(tool.category);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group card flex h-full flex-col transition-shadow hover:shadow-md focus-visible:shadow-md"
    >
      <div className="flex items-center gap-2 text-2xl" aria-hidden="true">
        {category?.icon}
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
        {tool.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
        {tool.description}
      </p>
      <span className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        {category?.name}
      </span>
    </Link>
  );
}
