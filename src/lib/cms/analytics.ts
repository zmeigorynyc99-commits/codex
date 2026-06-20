import type Database from 'better-sqlite3';
import { getDb } from './db';
import { toIso } from './sqlite-date';

type DB = Database.Database;

const MAX_ROWS = 200_000;

/** Records a single page view. Best-effort: never throws into the render path. */
export function logRequest(
  entry: { ip: string | null; path: string; tutorialSlug?: string | null; userAgent?: string | null },
  db: DB = getDb(),
): void {
  try {
    db.prepare(
      'INSERT INTO request_log (ip, path, tutorial_slug, user_agent) VALUES (?, ?, ?, ?)',
    ).run(entry.ip ?? null, entry.path.slice(0, 512), entry.tutorialSlug ?? null, (entry.userAgent ?? '').slice(0, 400));

    // Occasionally trim the log so it cannot grow without bound.
    if (Math.random() < 0.01) {
      db.prepare(
        `DELETE FROM request_log WHERE id NOT IN (SELECT id FROM request_log ORDER BY id DESC LIMIT ${MAX_ROWS})`,
      ).run();
    }
  } catch {
    /* analytics must never break a page render */
  }
}

export interface OverviewStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  visitorsToday: number;
}

export function overview(db: DB = getDb()): OverviewStats {
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    totalViews: one('SELECT COUNT(*) AS n FROM request_log'),
    uniqueVisitors: one('SELECT COUNT(DISTINCT ip) AS n FROM request_log'),
    viewsToday: one("SELECT COUNT(*) AS n FROM request_log WHERE created_at >= datetime('now','-1 day')"),
    visitorsToday: one("SELECT COUNT(DISTINCT ip) AS n FROM request_log WHERE created_at >= datetime('now','-1 day')"),
  };
}

export interface IpStat {
  ip: string;
  hits: number;
  lastSeen: string;
  blocked: boolean;
}

export function topIps(limit = 100, db: DB = getDb()): IpStat[] {
  const rows = db
    .prepare(
      `SELECT r.ip AS ip, COUNT(*) AS hits, MAX(r.created_at) AS last_seen,
              (SELECT 1 FROM blocked_ips b WHERE b.ip = r.ip) AS blocked
       FROM request_log r
       WHERE r.ip IS NOT NULL AND r.ip != ''
       GROUP BY r.ip
       ORDER BY hits DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{ ip: string; hits: number; last_seen: string; blocked: number | null }>;
  return rows.map((r) => ({ ip: r.ip, hits: r.hits, lastSeen: toIso(r.last_seen), blocked: r.blocked === 1 }));
}

export interface TutorialViewStat {
  slug: string;
  title: string | null;
  views: number;
  visitors: number;
}

export function topTutorials(limit = 20, db: DB = getDb()): TutorialViewStat[] {
  const rows = db
    .prepare(
      `SELECT r.tutorial_slug AS slug, t.title AS title,
              COUNT(*) AS views, COUNT(DISTINCT r.ip) AS visitors
       FROM request_log r
       LEFT JOIN tutorials t ON t.slug = r.tutorial_slug
       WHERE r.tutorial_slug IS NOT NULL
       GROUP BY r.tutorial_slug
       ORDER BY views DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{ slug: string; title: string | null; views: number; visitors: number }>;
  return rows.map((r) => ({ slug: r.slug, title: r.title, views: r.views, visitors: r.visitors }));
}

export interface RequestRow {
  id: number;
  ip: string | null;
  path: string;
  userAgent: string | null;
  createdAt: string;
}

export function recentRequests(limit = 200, db: DB = getDb()): RequestRow[] {
  const rows = db
    .prepare('SELECT id, ip, path, user_agent, created_at FROM request_log ORDER BY id DESC LIMIT ?')
    .all(limit) as Array<{ id: number; ip: string | null; path: string; user_agent: string | null; created_at: string }>;
  return rows.map((r) => ({ id: r.id, ip: r.ip, path: r.path, userAgent: r.user_agent, createdAt: toIso(r.created_at) }));
}
