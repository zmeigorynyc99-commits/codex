import type Database from 'better-sqlite3';
import { getDb } from './db';
import { toIso } from './sqlite-date';

type DB = Database.Database;

export interface BlockedIp {
  ip: string;
  reason: string | null;
  createdAt: string;
}

// Small in-memory cache so the site-wide visit check doesn't hit the DB on
// every request. Invalidated immediately on block/unblock.
let cache: { set: Set<string>; expires: number } | null = null;
const TTL_MS = 20_000;

function refresh(db: DB): Set<string> {
  const rows = db.prepare('SELECT ip FROM blocked_ips').all() as Array<{ ip: string }>;
  const set = new Set(rows.map((r) => r.ip));
  cache = { set, expires: Date.now() + TTL_MS };
  return set;
}

/** True when the given IP is on the blocklist (cached). Never throws. */
export function isBlocked(ip: string | null | undefined): boolean {
  if (!ip) return false;
  try {
    const set = cache && cache.expires > Date.now() ? cache.set : refresh(getDb());
    return set.has(ip);
  } catch {
    return false;
  }
}

export function blockIp(ip: string, reason: string | null, db: DB = getDb()): void {
  const clean = ip.trim();
  if (!clean) return;
  db.prepare('INSERT OR REPLACE INTO blocked_ips (ip, reason) VALUES (?, ?)').run(clean, reason);
  cache = null;
}

export function unblockIp(ip: string, db: DB = getDb()): boolean {
  const changed = db.prepare('DELETE FROM blocked_ips WHERE ip = ?').run(ip.trim()).changes > 0;
  cache = null;
  return changed;
}

export function listBlocked(db: DB = getDb()): BlockedIp[] {
  return (
    db.prepare('SELECT ip, reason, created_at FROM blocked_ips ORDER BY created_at DESC').all() as Array<{
      ip: string;
      reason: string | null;
      created_at: string;
    }>
  ).map((r) => ({ ip: r.ip, reason: r.reason, createdAt: toIso(r.created_at) }));
}
