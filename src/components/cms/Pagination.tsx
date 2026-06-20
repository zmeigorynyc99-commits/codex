import Link from 'next/link';

interface Props {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath?: string;
}

function buildHref(basePath: string, searchParams: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'page') params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ page, totalPages, searchParams, basePath = '/linux-tutorials' }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={buildHref(basePath, searchParams, page - 1)} className="btn-secondary" rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed opacity-50" aria-disabled="true">← Previous</span>
      )}
      <span className="px-3 text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(basePath, searchParams, page + 1)} className="btn-secondary" rel="next">
          Next →
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed opacity-50" aria-disabled="true">Next →</span>
      )}
    </nav>
  );
}
