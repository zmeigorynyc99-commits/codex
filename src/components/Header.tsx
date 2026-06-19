import Link from 'next/link';
import { siteConfig } from '@/lib/site';
import { ThemeToggle } from './ThemeToggle';
import { HeaderSearch } from './HeaderSearch';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="container-content flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white"
            aria-hidden="true"
          >
            TT
          </span>
          <span className="text-lg">{siteConfig.name}</span>
        </Link>

        <nav className="flex items-center gap-3" aria-label="Primary">
          <HeaderSearch />
          <Link
            href="/tools"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            All tools
          </Link>
          <Link
            href="/about"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-block dark:text-slate-200 dark:hover:bg-slate-800"
          >
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
