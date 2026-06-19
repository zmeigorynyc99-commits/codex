import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  CSRF_COOKIE,
  SESSION_TTL_DAYS,
  verifyLogin,
  createSession,
  generateCsrfToken,
} from '@/lib/cms/auth';
import { readJson, rateLimit, clientIp, SECURE_COOKIES } from '@/lib/cms/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Throttle brute-force attempts per IP.
  if (!rateLimit(`login:${clientIp()}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await readJson(request, 10_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = verifyLogin(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const token = createSession(user.id);
  const csrf = generateCsrfToken();
  const response = NextResponse.json({ ok: true });
  const maxAge = SESSION_TTL_DAYS * 86_400;

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  // CSRF token is readable by JS (double-submit pattern).
  response.cookies.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: SECURE_COOKIES,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return response;
}
