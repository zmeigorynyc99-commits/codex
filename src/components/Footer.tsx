import Link from 'next/link';
import { siteConfig } from '@/lib/site';
import { CATEGORIES } from '@/lib/tools';
import { DonateButton } from './DonateButton';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="container-content grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Free, fast and privacy-friendly tools for everyone. No accounts. No tracking by default.
          </p>
          <div className="mt-4">
            <DonateButton />
          </div>
        </div>

        <nav aria-label="Categories">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Categories</p>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.id}`}
                  className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Site">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Site</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/tools" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">All tools</Link></li>
            <li><Link href="/about" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">About</Link></li>
            <li><Link href="/contact" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">Contact</Link></li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/privacy" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">Terms of Use</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-slate-200 py-6 dark:border-slate-800">
        <p className="container-content text-center text-xs text-slate-500">
          © {year} {siteConfig.name}. Everything runs in your browser — your data never leaves your device.
        </p>
      </div>
    </footer>
  );
}
