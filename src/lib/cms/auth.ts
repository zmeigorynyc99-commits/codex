import crypto from 'node:crypto';
import type Database from 'better-sqlite3';
import { getDb } from './db';
import type { AdminUser } from './types';

type DB = Database.Database;

export const SESSION_COOKIE = 'tt_admin_session';
export const CSRF_COOKIE = 'tt_csrf';
export const SESSION_TTL_DAYS = 14;

const SCRYPT_KEYLEN = 64;

/** Hashes a password with scrypt and a random salt: scrypt$salt$hash (base64). */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/** Verifies a password against a stored hash in constant time. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1]!, 'base64');
    const expected = Buffer.from(parts[2]!, 'base64');
    const derived = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export function createAdmin(email: string, password: string, db: DB = getDb()): AdminUser {
  const normalized = email.trim().toLowerCase();
  db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(
    normalized,
    hashPassword(password),
  );
  return getAdminByEmail(normalized, db)!;
}

export function getAdminByEmail(email: string, db: DB = getDb()): AdminUser | null {
  const row = db
    .prepare('SELECT id, email, created_at FROM admin_users WHERE email = ?')
    .get(email.trim().toLowerCase()) as { id: number; email: string; created_at: string } | undefined;
  return row ? { id: row.id, email: row.email, createdAt: row.created_at } : null;
}

export function countAdmins(db: DB = getDb()): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM admin_users').get() as { n: number }).n;
}

/** Validates credentials, returning the user on success. */
export function verifyLogin(email: string, password: string, db: DB = getDb()): AdminUser | null {
  const row = db
    .prepare('SELECT id, email, password_hash, created_at FROM admin_users WHERE email = ?')
    .get(email.trim().toLowerCase()) as
    | { id: number; email: string; password_hash: string; created_at: string }
    | undefined;
  if (!row) {
    // Equalise timing whether or not the user exists.
    verifyPassword(password, 'scrypt$AAAA$AAAA');
    return null;
  }
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Creates a session and returns the raw (unhashed) token to set in a cookie. */
export function createSession(userId: number, db: DB = getDb()): string {
  const raw = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    sha256(raw),
    userId,
    expires,
  );
  return raw;
}

/** Resolves a raw session token to its admin user, or null if invalid/expired. */
export function getSessionUser(rawToken: string | undefined | null, db: DB = getDb()): AdminUser | null {
  if (!rawToken) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.created_at, s.expires_at
       FROM sessions s JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(sha256(rawToken)) as
    | { id: number; email: string; created_at: string; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(rawToken, db);
    return null;
  }
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

export function destroySession(rawToken: string | undefined | null, db: DB = getDb()): void {
  if (!rawToken) return;
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(rawToken));
}

/** Removes expired sessions (called opportunistically). */
export function purgeExpiredSessions(db: DB = getDb()): void {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

// ---- CSRF (double-submit token) ----

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/** Constant-time comparison of the cookie token and the submitted token. */
export function verifyCsrf(cookieToken: string | undefined | null, submitted: string | undefined | null): boolean {
  if (!cookieToken || !submitted) return false;
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(submitted);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
