import type { TocItem } from '@/lib/cms/markdown';

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Table of contents" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">On this page</p>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${item.id}`}
              className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
