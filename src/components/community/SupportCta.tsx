import Link from 'next/link';
import { siteConfig } from '@/lib/site';

/**
 * "Buy me a coffee / support with $1" call-to-action shown after posts.
 * Uses external links when configured (NEXT_PUBLIC_COFFEE_URL /
 * NEXT_PUBLIC_DONATE_URL / NEXT_PUBLIC_SUPPORT_URL); otherwise points to the
 * on-site /support page. No third-party scripts or pixels are loaded.
 */
export function SupportCta({ compact = false }: { compact?: boolean }) {
  const coffee = siteConfig.coffeeUrl || siteConfig.supportUrl || siteConfig.donateUrl;
  const dollar = siteConfig.donateUrl || siteConfig.supportUrl || siteConfig.coffeeUrl;

  const coffeeHref = coffee || '/support';
  const dollarHref = dollar || '/support';
  const external = (href: string) => /^https?:\/\//i.test(href);

  return (
    <aside
      className={`rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 ${
        compact ? 'p-4' : 'p-5'
      }`}
      aria-label="Support botera"
    >
      <p className="font-semibold text-slate-900 dark:text-white">
        ☕ Found this useful?
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        botera is free and ad-light. If it helped you, you can support the project — every little bit
        keeps the tutorials coming.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SupportLink href={coffeeHref} external={external(coffeeHref)} primary>
          ☕ Buy me a coffee
        </SupportLink>
        <SupportLink href={dollarHref} external={external(dollarHref)}>
          ♥ Support with $1
        </SupportLink>
      </div>
    </aside>
  );
}

function SupportLink({
  href,
  external,
  primary = false,
  children,
}: {
  href: string;
  external: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const cls = primary ? 'btn-primary' : 'btn-secondary';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
