import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '@/lib/cms/db';
import {
  createTutorial,
  updateTutorial,
  getTutorialBySlug,
  listTutorials,
  listLatestPublished,
  listFeaturedPublished,
  getAdjacent,
  getRelated,
  setStatus,
  deleteTutorial,
  slugExists,
  listRevisions,
  listCategories,
} from '@/lib/cms/tutorials';
import type { TutorialInput } from '@/lib/cms/types';

let db: Database.Database;

function input(overrides: Partial<TutorialInput> = {}): TutorialInput {
  return {
    title: 'Install Nginx on Ubuntu',
    summary: 'A short guide.',
    content: '# Hello\n\nSome content.',
    difficulty: 'Beginner',
    distribution: 'Ubuntu',
    author: 'Admin',
    status: 'draft',
    tags: [],
    ...overrides,
  };
}

beforeEach(() => {
  db = createTestDb();
});

describe('tutorial creation & slugs', () => {
  it('creates a tutorial and auto-generates a slug', () => {
    const t = createTutorial(input(), db);
    expect(t.id).toBeGreaterThan(0);
    expect(t.slug).toBe('install-nginx-on-ubuntu');
  });

  it('prevents duplicate slugs by suffixing', () => {
    createTutorial(input(), db);
    const second = createTutorial(input(), db);
    expect(second.slug).toBe('install-nginx-on-ubuntu-2');
    expect(slugExists('install-nginx-on-ubuntu', undefined, db)).toBe(true);
  });

  it('keeps the slug stable when the title changes on update', () => {
    const t = createTutorial(input(), db);
    const updated = updateTutorial(t.id, input({ title: 'Completely New Title' }), db)!;
    expect(updated.slug).toBe('install-nginx-on-ubuntu');
    expect(updated.title).toBe('Completely New Title');
  });

  it('allows an explicit slug change while preventing collisions', () => {
    createTutorial(input({ title: 'First', slug: 'taken' }), db);
    const t = createTutorial(input({ title: 'Second' }), db);
    const updated = updateTutorial(t.id, input({ title: 'Second', slug: 'taken' }), db)!;
    expect(updated.slug).toBe('taken-2');
  });
});

describe('draft vs published visibility', () => {
  it('hides drafts from published-only lookups', () => {
    const draft = createTutorial(input({ status: 'draft' }), db);
    expect(getTutorialBySlug(draft.slug, { publishedOnly: true }, db)).toBeNull();
    expect(getTutorialBySlug(draft.slug, {}, db)).not.toBeNull();
  });

  it('lists only published tutorials when publishedOnly is set', () => {
    createTutorial(input({ title: 'Draft one', status: 'draft' }), db);
    createTutorial(input({ title: 'Live one', status: 'published' }), db);
    const result = listTutorials({ publishedOnly: true }, db);
    expect(result.total).toBe(1);
    expect(result.items[0]!.title).toBe('Live one');
  });

  it('sets published_at automatically when publishing', () => {
    const t = createTutorial(input({ status: 'draft' }), db);
    expect(t.publishedAt).toBeNull();
    const published = setStatus(t.id, 'published', db)!;
    expect(published.publishedAt).not.toBeNull();
  });
});

describe('news feed ordering', () => {
  it('returns newest published tutorials in reverse chronological order', () => {
    createTutorial(input({ title: 'Oldest', status: 'published', publishedAt: '2023-01-01T00:00:00Z' }), db);
    createTutorial(input({ title: 'Newest', status: 'published', publishedAt: '2025-01-01T00:00:00Z' }), db);
    createTutorial(input({ title: 'Middle', status: 'published', publishedAt: '2024-01-01T00:00:00Z' }), db);
    createTutorial(input({ title: 'Hidden draft', status: 'draft' }), db);

    const feed = listLatestPublished(10, db);
    expect(feed.map((t) => t.title)).toEqual(['Newest', 'Middle', 'Oldest']);
  });
});

describe('search & filters', () => {
  beforeEach(() => {
    createTutorial(input({ title: 'Secure SSH', status: 'published', difficulty: 'Advanced', distribution: 'Debian', tags: ['security', 'ssh'] }), db);
    createTutorial(input({ title: 'Docker Basics', status: 'published', difficulty: 'Beginner', distribution: 'Ubuntu', tags: ['docker'] }), db);
  });

  it('filters by difficulty', () => {
    const r = listTutorials({ publishedOnly: true, difficulty: 'Advanced' }, db);
    expect(r.total).toBe(1);
    expect(r.items[0]!.title).toBe('Secure SSH');
  });

  it('filters by distribution', () => {
    const r = listTutorials({ publishedOnly: true, distribution: 'Ubuntu' }, db);
    expect(r.items[0]!.title).toBe('Docker Basics');
  });

  it('filters by tag slug', () => {
    const r = listTutorials({ publishedOnly: true, tag: 'security' }, db);
    expect(r.total).toBe(1);
    expect(r.items[0]!.title).toBe('Secure SSH');
  });

  it('searches title and content', () => {
    const r = listTutorials({ publishedOnly: true, search: 'docker' }, db);
    expect(r.total).toBe(1);
    expect(r.items[0]!.title).toBe('Docker Basics');
  });

  it('paginates results', () => {
    const r = listTutorials({ publishedOnly: true, pageSize: 1, page: 1 }, db);
    expect(r.items).toHaveLength(1);
    expect(r.totalPages).toBe(2);
  });
});

describe('featured, related, adjacent', () => {
  it('lists featured published tutorials', () => {
    createTutorial(input({ title: 'Featured', status: 'published', featured: true }), db);
    createTutorial(input({ title: 'Normal', status: 'published', featured: false }), db);
    const featured = listFeaturedPublished(5, db);
    expect(featured).toHaveLength(1);
    expect(featured[0]!.title).toBe('Featured');
  });

  it('computes previous/next by publication date', () => {
    const a = createTutorial(input({ title: 'A', status: 'published', publishedAt: '2024-01-01T00:00:00Z' }), db);
    const b = createTutorial(input({ title: 'B', status: 'published', publishedAt: '2024-02-01T00:00:00Z' }), db);
    const c = createTutorial(input({ title: 'C', status: 'published', publishedAt: '2024-03-01T00:00:00Z' }), db);
    const adj = getAdjacent(b, db);
    expect(adj.prev?.title).toBe('A');
    expect(adj.next?.title).toBe('C');
    expect(getAdjacent(a, db).prev).toBeNull();
    expect(getAdjacent(c, db).next).toBeNull();
  });

  it('finds related tutorials sharing a category', () => {
    const cat = listCategories(db)[0]!;
    const base = createTutorial(input({ title: 'Base', status: 'published', categoryId: cat.id }), db);
    createTutorial(input({ title: 'Same category', status: 'published', categoryId: cat.id }), db);
    const related = getRelated(base, 5, db);
    expect(related.some((t) => t.title === 'Same category')).toBe(true);
    expect(related.some((t) => t.id === base.id)).toBe(false);
  });
});

describe('revisions & deletion', () => {
  it('stores a revision on update', () => {
    const t = createTutorial(input(), db);
    updateTutorial(t.id, input({ content: 'changed' }), db);
    expect(listRevisions(t.id, db).length).toBe(1);
  });

  it('deletes a tutorial and cascades tags/revisions', () => {
    const t = createTutorial(input({ tags: ['x'] }), db);
    updateTutorial(t.id, input({ content: 'v2' }), db);
    expect(deleteTutorial(t.id, db)).toBe(true);
    expect(getTutorialBySlug(t.slug, {}, db)).toBeNull();
    expect(listRevisions(t.id, db)).toHaveLength(0);
  });
});
