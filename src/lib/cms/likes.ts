import type Database from 'better-sqlite3';
import { getDb } from './db';

type DB = Database.Database;

export function likeCount(tutorialId: number, db: DB = getDb()): number {
  return (
    db.prepare('SELECT COUNT(*) AS n FROM tutorial_likes WHERE tutorial_id = ?').get(tutorialId) as { n: number }
  ).n;
}

export function hasLiked(tutorialId: number, ip: string | null, db: DB = getDb()): boolean {
  if (!ip) return false;
  return Boolean(db.prepare('SELECT 1 FROM tutorial_likes WHERE tutorial_id = ? AND ip = ?').get(tutorialId, ip));
}

/** Toggles a like for (tutorial, ip). Returns the new state and total count. */
export function toggleLike(
  tutorialId: number,
  ip: string,
  db: DB = getDb(),
): { liked: boolean; count: number } {
  const exists = hasLiked(tutorialId, ip, db);
  if (exists) {
    db.prepare('DELETE FROM tutorial_likes WHERE tutorial_id = ? AND ip = ?').run(tutorialId, ip);
  } else {
    db.prepare('INSERT OR IGNORE INTO tutorial_likes (tutorial_id, ip) VALUES (?, ?)').run(tutorialId, ip);
  }
  return { liked: !exists, count: likeCount(tutorialId, db) };
}

export interface LikedTutorial {
  slug: string;
  title: string | null;
  likes: number;
}

export function topLiked(limit = 20, db: DB = getDb()): LikedTutorial[] {
  const rows = db
    .prepare(
      `SELECT t.slug AS slug, t.title AS title, COUNT(*) AS likes
       FROM tutorial_likes l JOIN tutorials t ON t.id = l.tutorial_id
       GROUP BY l.tutorial_id ORDER BY likes DESC LIMIT ?`,
    )
    .all(limit) as Array<{ slug: string; title: string | null; likes: number }>;
  return rows.map((r) => ({ slug: r.slug, title: r.title, likes: r.likes }));
}
