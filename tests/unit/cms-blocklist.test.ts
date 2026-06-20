import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '@/lib/cms/db';
import { blockIp, unblockIp, listBlocked } from '@/lib/cms/blocklist';
import { createThread } from '@/lib/cms/forum';
import { createMessage } from '@/lib/cms/messages';

let db: Database.Database;
beforeEach(() => {
  db = createTestDb();
});

describe('blocklist repository', () => {
  it('blocks, lists and unblocks IPs', () => {
    blockIp('203.0.113.7', 'spam', db);
    blockIp('198.51.100.2', null, db);
    const list = listBlocked(db);
    expect(list.map((b) => b.ip).sort()).toEqual(['198.51.100.2', '203.0.113.7']);
    expect(list.find((b) => b.ip === '203.0.113.7')!.reason).toBe('spam');

    expect(unblockIp('203.0.113.7', db)).toBe(true);
    expect(listBlocked(db).map((b) => b.ip)).toEqual(['198.51.100.2']);
  });

  it('is idempotent (re-blocking updates the reason)', () => {
    blockIp('203.0.113.7', 'first', db);
    blockIp('203.0.113.7', 'second', db);
    const list = listBlocked(db);
    expect(list).toHaveLength(1);
    expect(list[0]!.reason).toBe('second');
  });
});

describe('IP capture on submissions', () => {
  it('stores the real IP address on forum threads and messages', () => {
    const t = createThread(
      { title: 'Hi', authorName: 'A', body: 'hello', status: 'approved', ipAddress: '203.0.113.9' },
      db,
    );
    expect(t.ipAddress).toBe('203.0.113.9');

    const m = createMessage(
      { kind: 'contact', name: 'A', contact: null, subject: 'S', body: 'body', ipAddress: '198.51.100.5' },
      db,
    );
    expect(m.ipAddress).toBe('198.51.100.5');
  });
});
