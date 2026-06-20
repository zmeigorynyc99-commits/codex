import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { siteConfig } from '@/lib/site';
import { websiteJsonLd } from '@/lib/seo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from '@/components/Analytics';
import { isBlocked } from '@/lib/cms/blocklist';
import { clientIp } from '@/lib/cms/api';
import { logRequest } from '@/lib/cms/analytics';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  referrer: 'strict-origin-when-cross-origin',
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [{ url: '/og-default.svg', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// The inline theme bootstrap avoids a flash of the wrong color scheme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const h = headers();
  const nonce = h.get('x-nonce') ?? undefined;

  // Site-wide block for abusive IPs. The admin area is exempt so an admin can
  // never lock themselves out of moderation, and /api enforces its own checks.
  const pathname = h.get('x-pathname') ?? '';
  const exempt = pathname.startsWith('/admin') || pathname.startsWith('/api');
  const ip = clientIp();
  const blocked = !exempt && isBlocked(ip);

  // Record the page view for the admin statistics dashboard. Skip the admin
  // area, API routes and prefetch requests so counts reflect real visits.
  const isPrefetch = h.get('next-router-prefetch') === '1' || h.get('purpose') === 'prefetch';
  if (pathname && !exempt && !isPrefetch) {
    const tutorialSlug = pathname.startsWith('/linux-tutorials/')
      ? pathname.slice('/linux-tutorials/'.length).split('/')[0] || null
      : null;
    logRequest({ ip, path: pathname, tutorialSlug, userAgent: h.get('user-agent') });
  }

  return (
    <html lang={siteConfig.locale} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {themeScript}
        </Script>
        <script
          type="application/ld+json"
          nonce={nonce}
          // JSON-LD is generated from trusted, static config — not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {blocked ? (
          <main className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <h1 className="text-2xl font-bold">Access restricted</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Your access to this site has been restricted. If you believe this is a mistake, please
                contact the site administrator.
              </p>
            </div>
          </main>
        ) : (
          <>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <Analytics nonce={nonce} />
          </>
        )}
      </body>
    </html>
  );
}
