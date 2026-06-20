import type Database from 'better-sqlite3';
import { getDb } from './db';
import { toIso } from './sqlite-date';
import type { ModerationStatus } from './community';

type DB = Database.Database;

export interface Comment {
  id: number;
  tutorialId: number;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
}

interface CommentRow {
  id: number; tutorial_id: number; author_name: string; body: string; status: string; created_at: string;
}

function mapComment(r: CommentRow): Comment {
  return {
    id: r.id, tutorialId: r.tutorial_id, authorName: r.author_name, body: r.body,
    status: r.status as ModerationStatus, createdAt: toIso(r.created_at),
  };
}

export function createComment(
  tutorialId: number,
  input: { authorName: string; body: string; status: ModerationStatus; ipHash?: string },
  db: DB = getDb(),
): Comment | null {
  const tutorial = db.prepare("SELECT id, status FROM tutorials WHERE id = ?").get(tutorialId) as
    | { id: number; status: string }
    | undefined;
  // Only allow comments on published tutorials.
  if (!tutorial || tutorial.status !== 'published') return null;
  const result = db
    .prepare(
      `INSERT INTO comments (tutorial_id, author_name, body, status, ip_hash)
       VALUES (@tid, @author, @body, @status, @ip)`,
    )
    .run({ tid: tutorialId, author: input.authorName, body: input.body, status: input.status, ip: input.ipHash ?? null });
  const r = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(result.lastInsertRowid)) as CommentRow;
  return mapComment(r);
}

export function listComments(
  tutorialId: number,
  options: { publicOnly?: boolean } = {},
  db: DB = getDb(),
): Comment[] {
  const sql = options.publicOnly
    ? "SELECT * FROM comments WHERE tutorial_id = ? AND status = 'approved' ORDER BY created_at ASC"
    : 'SELECT * FROM comments WHERE tutorial_id = ? ORDER BY created_at ASC';
  return (db.prepare(sql).all(tutorialId) as CommentRow[]).map(mapComment);
}

export function countApprovedComments(tutorialId: number, db: DB = getDb()): number {
  return (
    db.prepare("SELECT COUNT(*) AS n FROM comments WHERE tutorial_id = ? AND status = 'approved'").get(tutorialId) as {
      n: number;
    }
  ).n;
}

export function setCommentStatus(id: number, status: ModerationStatus, db: DB = getDb()): void {
  db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, id);
}
export function deleteComment(id: number, db: DB = getDb()): boolean {
  return db.prepare('DELETE FROM comments WHERE id = ?').run(id).changes > 0;
}

export function listCommentsForModeration(
  db: DB = getDb(),
): Array<Comment & { tutorialTitle: string; tutorialSlug: string }> {
  const rows = db
    .prepare(
      `SELECT c.*, t.title AS tutorial_title, t.slug AS tutorial_slug
       FROM comments c JOIN tutorials t ON t.id = c.tutorial_id
       ORDER BY c.created_at DESC LIMIT 200`,
    )
    .all() as Array<CommentRow & { tutorial_title: string; tutorial_slug: string }>;
  return rows.map((r) => ({ ...mapComment(r), tutorialTitle: r.tutorial_title, tutorialSlug: r.tutorial_slug }));
}

export function countCommentsByStatus(status: ModerationStatus, db: DB = getDb()): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM comments WHERE status = ?').get(status) as { n: number }).n;
}
