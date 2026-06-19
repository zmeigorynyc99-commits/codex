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
const SESSION_COOKIE = 'tt_admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Coarse, cookie-presence gate for admin areas. Full, DB-backed
  // authentication is enforced server-side in the admin layout and in every
  // /api/admin route handler; this only avoids rendering admin shells to
  // anonymous visitors and returns 401 quickly for unauthenticated API calls.
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
  if (isAdminPage || isAdminApi) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https: data: blob:`,
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

  // Keep admin, API and preview routes out of search indexes.
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.includes('/preview')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

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
