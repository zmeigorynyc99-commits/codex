import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from './api';
import { isBlocked } from './blocklist';

export interface GuardOptions {
  /** Logical action name, used as the rate-limit bucket key. */
  action: string;
  /** Max submissions allowed per window per IP. */
  limit?: number;
  /** Window length in milliseconds. */
  windowMs?: number;
}

/**
 * Protects anonymous public POST endpoints (forum, comments, contact) from
 * abuse without any third-party CAPTCHA:
 *   - same-origin check (Origin/Referer must match the site host),
 *   - honeypot field (`website` must be empty — bots tend to fill every field),
 *   - per-IP rate limiting.
 * Returns a NextResponse to short-circuit on failure, or null to proceed.
 */
export function guardPublicSubmission(
  request: Request,
  body: Record<string, unknown>,
  options: GuardOptions,
): NextResponse | null {
  const h = headers();
  const host = h.get('host');

  // Reject submissions from blocked IPs outright.
  if (isBlocked(clientIp())) {
    return NextResponse.json({ error: 'Your access has been restricted.' }, { status: 403 });
  }

  // Same-origin enforcement.
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const source = origin || referer;
  if (source && host) {
    try {
      if (new URL(source).host !== host) {
        return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }
  }

  // Honeypot: a hidden field real users never fill in.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    // Pretend success to not tip off bots, but do nothing downstream.
    return NextResponse.json({ ok: true });
  }

  // Per-IP rate limiting.
  const limit = options.limit ?? 5;
  const windowMs = options.windowMs ?? 10 * 60 * 1000;
  if (!rateLimit(`${options.action}:${clientIp()}`, limit, windowMs)) {
    return NextResponse.json(
      { error: 'You are sending messages too quickly. Please wait a few minutes.' },
      { status: 429 },
    );
  }

  return null;
}
