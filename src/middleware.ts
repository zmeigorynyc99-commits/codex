import { NextResponse, type NextRequest } from 'next/server';

/**
 * Sets a strict, nonce-based Content-Security-Policy on every HTML response.
 *
 * A fresh nonce is generated per request and exposed to the app via the
 * `x-nonce` request header. Next.js automatically attaches this nonce to the
 * framework scripts it injects, and `strict-dynamic` lets those trusted
 * scripts load the rest of the bundle — so no `unsafe-inline` is needed for
 * scripts. Inline styles are permitted (low risk) because Tailwind and React
 * occasionally emit style attributes.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    `worker-src 'self' blob:`,
    `upgrade-insecure-requests`,
  ]
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}

export const config = {
  // Skip static assets and image optimisation; apply to all pages/routes.
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
