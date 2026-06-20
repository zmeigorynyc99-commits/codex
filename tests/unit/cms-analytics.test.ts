import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '@/lib/cms/db';
import { logRequest, overview, topIps, topTutorials, recentRequests } from '@/lib/cms/analytics';
import { toggleLike, likeCount, hasLiked, topLiked } from '@/lib/cms/likes';
import { createTutorial } from '@/lib/cms/tutorials';
import { blockIp } from '@/lib/cms/blocklist';

let db: Database.Database;
beforeEach(() => {
  db = createTestDb();
});

describe('analytics', () => {
  it('counts views, unique visitors and top IPs', () => {
    logRequest({ ip: '1.1.1.1', path: '/' }, db);
    logRequest({ ip: '1.1.1.1', path: '/forum' }, db);
    logRequest({ ip: '2.2.2.2', path: '/' }, db);

    const o = overview(db);
    expect(o.totalViews).toBe(3);
    expect(o.uniqueVisitors).toBe(2);

    const ips = topIps(10, db);
    expect(ips[0]!.ip).toBe('1.1.1.1');
    expect(ips[0]!.hits).toBe(2);
  });

  it('flags blocked IPs in the top list', () => {
    logRequest({ ip: '9.9.9.9', path: '/' }, db);
    blockIp('9.9.9.9', 'abuse', db);
    expect(topIps(10, db)[0]!.blocked).toBe(true);
  });

  it('aggregates views per tutorial with titles', () => {
    const t = createTutorial(
      { title: 'Guide', summary: 's', content: 'c', difficulty: 'Beginner', distribution: 'Ubuntu', author: 'A', status: 'published', tags: [] },
      db,
    );
    logRequest({ ip: '1.1.1.1', path: `/linux-tutorials/${t.slug}`, tutorialSlug: t.slug }, db);
    logRequest({ ip: '2.2.2.2', path: `/linux-tutorials/${t.slug}`, tutorialSlug: t.slug }, db);
    const top = topTutorials(10, db);
    expect(top[0]!.slug).toBe(t.slug);
    expect(top[0]!.title).toBe('Guide');
    expect(top[0]!.views).toBe(2);
    expect(top[0]!.visitors).toBe(2);
  });

  it('returns recent requests newest first', () => {
    logRequest({ ip: '1.1.1.1', path: '/a' }, db);
    logRequest({ ip: '1.1.1.1', path: '/b' }, db);
    const recent = recentRequests(10, db);
    expect(recent[0]!.path).toBe('/b');
  });
});

describe('likes', () => {
  function tutorial() {
    return createTutorial(
      { title: 'L', summary: 's', content: 'c', difficulty: 'Beginner', distribution: 'Ubuntu', author: 'A', status: 'published', tags: [] },
      db,
    );
  }

  it('toggles a like per IP and counts uniquely', () => {
    const t = tutorial();
    expect(toggleLike(t.id, '1.1.1.1', db)).toEqual({ liked: true, count: 1 });
    expect(toggleLike(t.id, '2.2.2.2', db)).toEqual({ liked: true, count: 2 });
    // same IP toggles off
    expect(toggleLike(t.id, '1.1.1.1', db)).toEqual({ liked: false, count: 1 });
    expect(likeCount(t.id, db)).toBe(1);
    expect(hasLiked(t.id, '2.2.2.2', db)).toBe(true);
    expect(hasLiked(t.id, '1.1.1.1', db)).toBe(false);
  });

  it('ranks most-liked tutorials', () => {
    const a = tutorial();
    const b = tutorial();
    toggleLike(a.id, '1.1.1.1', db);
    toggleLike(a.id, '2.2.2.2', db);
    toggleLike(b.id, '3.3.3.3', db);
    const top = topLiked(10, db);
    expect(top[0]!.slug).toBe(a.slug);
    expect(top[0]!.likes).toBe(2);
  });
});
