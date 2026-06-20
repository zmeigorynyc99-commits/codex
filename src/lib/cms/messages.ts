import type Database from 'better-sqlite3';
import { getDb } from './db';
import { toIso } from './sqlite-date';

type DB = Database.Database;

export type MessageKind = 'contact' | 'question';
export type MessageStatus = 'new' | 'read' | 'archived';

export interface Message {
  id: number;
  kind: MessageKind;
  name: string;
  contact: string | null;
  subject: string;
  body: string;
  status: MessageStatus;
  ipAddress: string | null;
  createdAt: string;
}

interface MessageRow {
  id: number; kind: string; name: string; contact: string | null;
  subject: string; body: string; status: string; ip_address: string | null; created_at: string;
}

function mapMessage(r: MessageRow): Message {
  return {
    id: r.id, kind: r.kind as MessageKind, name: r.name, contact: r.contact,
    subject: r.subject, body: r.body, status: r.status as MessageStatus,
    ipAddress: r.ip_address ?? null, createdAt: toIso(r.created_at),
  };
}

export function createMessage(
  input: { kind: MessageKind; name: string; contact: string | null; subject: string; body: string; ipHash?: string; ipAddress?: string },
  db: DB = getDb(),
): Message {
  const result = db
    .prepare(
      `INSERT INTO messages (kind, name, contact, subject, body, ip_hash, ip_address)
       VALUES (@kind, @name, @contact, @subject, @body, @ip, @ipaddr)`,
    )
    .run({
      kind: input.kind, name: input.name, contact: input.contact, subject: input.subject,
      body: input.body, ip: input.ipHash ?? null, ipaddr: input.ipAddress ?? null,
    });
  const r = db.prepare('SELECT * FROM messages WHERE id = ?').get(Number(result.lastInsertRowid)) as MessageRow;
  return mapMessage(r);
}

export function listMessages(
  options: { status?: MessageStatus; kind?: MessageKind } = {},
  db: DB = getDb(),
): Message[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (options.status) {
    where.push('status = @status');
    params.status = options.status;
  }
  if (options.kind) {
    where.push('kind = @kind');
    params.kind = options.kind;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return (
    db.prepare(`SELECT * FROM messages ${whereSql} ORDER BY created_at DESC LIMIT 500`).all(params) as MessageRow[]
  ).map(mapMessage);
}

export function setMessageStatus(id: number, status: MessageStatus, db: DB = getDb()): void {
  db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id);
}
export function deleteMessage(id: number, db: DB = getDb()): boolean {
  return db.prepare('DELETE FROM messages WHERE id = ?').run(id).changes > 0;
}
export function countNewMessages(db: DB = getDb()): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM messages WHERE status = 'new'").get() as { n: number }).n;
}
