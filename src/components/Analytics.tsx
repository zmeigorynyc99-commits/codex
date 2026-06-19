import Script from 'next/script';
import { siteConfig } from '@/lib/site';

/**
 * Privacy-friendly, cookie-free analytics placeholder.
 *
 * Renders nothing unless both NEXT_PUBLIC_ANALYTICS_DOMAIN and
 * NEXT_PUBLIC_ANALYTICS_SRC are set. The expected endpoint is a Plausible- or
 * Umami-compatible script that sets no cookies and collects no personal data.
 * When enabling this, remember to add the analytics origin to the CSP
 * `script-src` and `connect-src` directives in src/middleware.ts.
 */
export function Analytics({ nonce }: { nonce?: string }) {
  const { domain, src } = siteConfig.analytics;
  if (!domain || !src) return null;

  return (
    <Script
      src={src}
      data-domain={domain}
      strategy="afterInteractive"
      nonce={nonce}
      defer
    />
  );
}
