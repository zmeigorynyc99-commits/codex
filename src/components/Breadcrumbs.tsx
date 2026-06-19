import Link from 'next/link';

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-1">
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700 dark:hover:text-brand-300">
                {item.name}
              </Link>
            ) : (
              <span className="text-slate-700 dark:text-slate-300" aria-current="page">
                {item.name}
              </span>
            )}
            {index < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
