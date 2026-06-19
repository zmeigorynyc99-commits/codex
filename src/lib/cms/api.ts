import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, CSRF_COOKIE, getSessionUser, verifyCsrf } from './auth';
import { siteConfig } from '@/lib/site';
import type { AdminUser } from './types';

/** Returns the authenticated admin for an API route, or null. */
export function currentApiAdmin(): AdminUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? getSessionUser(token) : null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(errors: unknown): NextResponse {
  return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
}

/**
 * Guards a mutating admin API call: requires a valid session, a matching
 * CSRF token (double-submit) and a same-origin request. Returns the admin on
 * success or a NextResponse to return immediately on failure.
 */
export function guardMutation(request: Request): AdminUser | NextResponse {
  const admin = currentApiAdmin();
  if (!admin) return unauthorized();

  // Same-origin check.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const o = new URL(origin);
      const host = headers().get('host');
      if (host && o.host !== host) return forbidden('Cross-origin request blocked');
    } catch {
      return forbidden('Invalid origin');
    }
  }

  // CSRF double-submit token.
  const cookieToken = cookies().get(CSRF_COOKIE)?.value;
  const submitted = request.headers.get('x-csrf-token');
  if (!verifyCsrf(cookieToken, submitted)) return forbidden('Invalid CSRF token');

  return admin;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/** Reads and size-limits a JSON request body. */
export async function readJson(request: Request, maxBytes = 1_000_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('Payload too large');
  return text ? JSON.parse(text) : {};
}

// ---- Simple in-memory rate limiter (per-process) ----

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the action is allowed; false when the limit is exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(): string {
  const h = headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip') ?? 'unknown';
}

export const SECURE_COOKIES = siteConfig.url.startsWith('https://');
