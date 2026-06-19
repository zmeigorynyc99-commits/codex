import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, getSessionUser, purgeExpiredSessions } from './auth';
import type { AdminUser } from './types';

/** Reads the current admin from the session cookie, or null if signed out. */
export function getCurrentAdmin(): AdminUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    purgeExpiredSessions();
    return getSessionUser(token);
  } catch {
    return null;
  }
}

/** For server components: redirects to the login page when not authenticated. */
export function requireAdmin(returnTo?: string): AdminUser {
  const user = getCurrentAdmin();
  if (!user) {
    const target = returnTo ? `/admin/login?next=${encodeURIComponent(returnTo)}` : '/admin/login';
    redirect(target);
  }
  return user;
}
