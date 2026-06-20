import type Database from 'better-sqlite3';
import { getDb } from './db';
import { slugify, uniqueSlug } from './slug';
import { toIso } from './sqlite-date';
import type { ModerationStatus } from './community';

type DB = Database.Database;

export interface ForumThread {
  id: number;
  title: string;
  slug: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  pinned: boolean;
  locked: boolean;
  replyCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ForumReply {
  id: number;
  threadId: number;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
}

interface ThreadRow {
  id: number; title: string; slug: string; author_name: string; body: string;
  status: string; pinned: number; locked: number; reply_count: number;
  created_at: string; last_activity_at: string;
}
interface ReplyRow {
  id: number; thread_id: number; author_name: string; body: string;
  status: string; created_at: string;
}

function mapThread(r: ThreadRow): ForumThread {
  return {
    id: r.id, title: r.title, slug: r.slug, authorName: r.author_name, body: r.body,
    status: r.status as ModerationStatus, pinned: r.pinned === 1, locked: r.locked === 1,
    replyCount: r.reply_count, createdAt: toIso(r.created_at), lastActivityAt: toIso(r.last_activity_at),
  };
}
function mapReply(r: ReplyRow): ForumReply {
  return {
    id: r.id, threadId: r.thread_id, authorName: r.author_name, body: r.body,
    status: r.status as ModerationStatus, createdAt: toIso(r.created_at),
  };
}

export interface NewThread {
  title: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  ipHash?: string;
}

export function createThread(input: NewThread, db: DB = getDb()): ForumThread {
  const slug = uniqueSlug(input.title, (s) =>
    Boolean(db.prepare('SELECT 1 FROM forum_threads WHERE slug = ?').get(s)),
  );
  const result = db
    .prepare(
      `INSERT INTO forum_threads (title, slug, author_name, body, status, ip_hash)
       VALUES (@title, @slug, @author, @body, @status, @ip)`,
    )
    .run({
      title: input.title, slug, author: input.authorName, body: input.body,
      status: input.status, ip: input.ipHash ?? null,
    });
  return getThreadById(Number(result.lastInsertRowid), db)!;
}

export function createReply(
  threadId: number,
  input: { authorName: string; body: string; status: ModerationStatus; ipHash?: string },
  db: DB = getDb(),
): ForumReply | null {
  const thread = db.prepare('SELECT id, locked FROM forum_threads WHERE id = ?').get(threadId) as
    | { id: number; locked: number }
    | undefined;
  if (!thread || thread.locked === 1) return null;

  const result = db
    .prepare(
      `INSERT INTO forum_replies (thread_id, author_name, body, status, ip_hash)
       VALUES (@thread, @author, @body, @status, @ip)`,
    )
    .run({ thread: threadId, author: input.authorName, body: input.body, status: input.status, ip: input.ipHash ?? null });

  // Only approved replies bump activity and the public reply count.
  if (input.status === 'approved') {
    db.prepare(
      "UPDATE forum_threads SET reply_count = reply_count + 1, last_activity_at = datetime('now') WHERE id = ?",
    ).run(threadId);
  }
  return getReplyById(Number(result.lastInsertRowid), db);
}

export function getThreadById(id: number, db: DB = getDb()): ForumThread | null {
  const r = db.prepare('SELECT * FROM forum_threads WHERE id = ?').get(id) as ThreadRow | undefined;
  return r ? mapThread(r) : null;
}

export function getThreadBySlug(
  slug: string,
  options: { publicOnly?: boolean } = {},
  db: DB = getDb(),
): ForumThread | null {
  const r = db.prepare('SELECT * FROM forum_threads WHERE slug = ?').get(slug) as ThreadRow | undefined;
  if (!r) return null;
  if (options.publicOnly && r.status !== 'approved') return null;
  return mapThread(r);
}

function getReplyById(id: number, db: DB): ForumReply | null {
  const r = db.prepare('SELECT * FROM forum_replies WHERE id = ?').get(id) as ReplyRow | undefined;
  return r ? mapReply(r) : null;
}

export interface ThreadListResult {
  items: ForumThread[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function listThreads(
  filters: { publicOnly?: boolean; status?: ModerationStatus; search?: string; page?: number; pageSize?: number } = {},
  db: DB = getDb(),
): ThreadListResult {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.publicOnly) where.push("status = 'approved'");
  else if (filters.status) {
    where.push('status = @status');
    params.status = filters.status;
  }
  if (filters.search && filters.search.trim()) {
    where.push('(title LIKE @q OR body LIKE @q)');
    params.q = `%${filters.search.trim().replace(/[%_]/g, (m) => `\\${m}`)}%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM forum_threads ${whereSql}`).get(params) as { n: number }).n;
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const rows = db
    .prepare(
      `SELECT * FROM forum_threads ${whereSql} ORDER BY pinned DESC, last_activity_at DESC LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize }) as ThreadRow[];
  return { items: rows.map(mapThread), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function listReplies(
  threadId: number,
  options: { publicOnly?: boolean } = {},
  db: DB = getDb(),
): ForumReply[] {
  const sql = options.publicOnly
    ? "SELECT * FROM forum_replies WHERE thread_id = ? AND status = 'approved' ORDER BY created_at ASC"
    : 'SELECT * FROM forum_replies WHERE thread_id = ? ORDER BY created_at ASC';
  return (db.prepare(sql).all(threadId) as ReplyRow[]).map(mapReply);
}

// ---- Moderation ----

export function setThreadStatus(id: number, status: ModerationStatus, db: DB = getDb()): void {
  db.prepare('UPDATE forum_threads SET status = ? WHERE id = ?').run(status, id);
}
export function setReplyStatus(id: number, status: ModerationStatus, db: DB = getDb()): void {
  db.prepare('UPDATE forum_replies SET status = ? WHERE id = ?').run(status, id);
}
export function setThreadFlags(id: number, flags: { pinned?: boolean; locked?: boolean }, db: DB = getDb()): void {
  if (flags.pinned !== undefined) db.prepare('UPDATE forum_threads SET pinned = ? WHERE id = ?').run(flags.pinned ? 1 : 0, id);
  if (flags.locked !== undefined) db.prepare('UPDATE forum_threads SET locked = ? WHERE id = ?').run(flags.locked ? 1 : 0, id);
}
export function deleteThread(id: number, db: DB = getDb()): boolean {
  return db.prepare('DELETE FROM forum_threads WHERE id = ?').run(id).changes > 0;
}
export function deleteReply(id: number, db: DB = getDb()): boolean {
  const reply = db.prepare('SELECT thread_id, status FROM forum_replies WHERE id = ?').get(id) as
    | { thread_id: number; status: string }
    | undefined;
  const changed = db.prepare('DELETE FROM forum_replies WHERE id = ?').run(id).changes > 0;
  if (changed && reply && reply.status === 'approved') {
    db.prepare('UPDATE forum_threads SET reply_count = MAX(0, reply_count - 1) WHERE id = ?').run(reply.thread_id);
  }
  return changed;
}

export function countThreadsByStatus(status: ModerationStatus, db: DB = getDb()): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM forum_threads WHERE status = ?').get(status) as { n: number }).n;
}
export function listRepliesForModeration(db: DB = getDb()): Array<ForumReply & { threadSlug: string; threadTitle: string }> {
  const rows = db
    .prepare(
      `SELECT r.*, t.slug AS thread_slug, t.title AS thread_title
       FROM forum_replies r JOIN forum_threads t ON t.id = r.thread_id
       ORDER BY r.created_at DESC LIMIT 200`,
    )
    .all() as Array<ReplyRow & { thread_slug: string; thread_title: string }>;
  return rows.map((r) => ({ ...mapReply(r), threadSlug: r.thread_slug, threadTitle: r.thread_title }));
}
