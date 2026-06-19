import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '@/lib/cms/db';
import { createTutorial } from '@/lib/cms/tutorials';
import { slugify, uniqueSlug } from '@/lib/cms/slug';
import { validateTutorialInput, isSafeImageRef } from '@/lib/cms/validation';
import { buildRssFeed } from '@/lib/cms/rss';
import { effectiveTitle, effectiveDescription, tutorialMetadata } from '@/lib/cms/seo';
import type { TutorialInput } from '@/lib/cms/types';

describe('slug helpers', () => {
  it('slugifies text', () => {
    expect(slugify('Install Nginx on Ubuntu 22.04!')).toBe('install-nginx-on-ubuntu-22-04');
    expect(slugify('  Héllo  World  ')).toBe('hello-world');
  });

  it('generates unique slugs', () => {
    const taken = new Set(['guide', 'guide-2']);
    expect(uniqueSlug('Guide', (s) => taken.has(s))).toBe('guide-3');
  });
});

describe('validation', () => {
  it('requires a title and valid enums', () => {
    const result = validateTutorialInput({ title: '', difficulty: 'X', distribution: 'Y', status: 'z' });
    expect(result.ok).toBe(false);
    expect(result.errors.title).toBeTruthy();
    expect(result.errors.difficulty).toBeTruthy();
    expect(result.errors.distribution).toBeTruthy();
    expect(result.errors.status).toBeTruthy();
  });

  it('accepts and normalises valid input', () => {
    const result = validateTutorialInput({
      title: 'My Guide',
      summary: 'x',
      content: '# hi',
      difficulty: 'Beginner',
      distribution: 'Ubuntu',
      status: 'draft',
      tags: 'a, b, , c',
      featured: 'on',
    });
    expect(result.ok).toBe(true);
    expect(result.value?.slug).toBe('my-guide');
    expect(result.value?.tags).toEqual(['a', 'b', 'c']);
    expect(result.value?.featured).toBe(true);
  });

  it('rejects unsafe image references', () => {
    expect(isSafeImageRef('https://cdn.example.com/a.png')).toBe(true);
    expect(isSafeImageRef('/uploads/a.png')).toBe(true);
    expect(isSafeImageRef('/uploads/../../etc/passwd')).toBe(false);
    expect(isSafeImageRef('javascript:alert(1)')).toBe(false);
    expect(isSafeImageRef('data:image/png;base64,xx')).toBe(false);
  });
});

describe('rss feed', () => {
  let db: Database.Database;
  beforeEach(() => {
    db = createTestDb();
  });

  function input(o: Partial<TutorialInput>): TutorialInput {
    return {
      title: 'T', summary: 's', content: 'c', difficulty: 'Beginner',
      distribution: 'Ubuntu', author: 'A', status: 'published', tags: [], ...o,
    };
  }

  it('produces valid RSS containing only the given items', () => {
    const a = createTutorial(input({ title: 'Alpha & Beta', publishedAt: '2024-01-01T00:00:00Z' }), db);
    const xml = buildRssFeed([a]);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<item>');
    expect(xml).toContain('Alpha &amp; Beta'); // escaped
    expect(xml).toContain('/linux-tutorials/alpha-beta');
    expect((xml.match(/<item>/g) || []).length).toBe(1);
  });
});

describe('seo metadata fallbacks', () => {
  let db: Database.Database;
  beforeEach(() => {
    db = createTestDb();
  });

  it('falls back to title and summary when SEO fields are empty', () => {
    const t = createTutorial(
      {
        title: 'Real Title', summary: 'Real summary.', content: 'c',
        difficulty: 'Beginner', distribution: 'Ubuntu', author: 'A',
        status: 'published', tags: [],
      },
      db,
    );
    expect(effectiveTitle(t)).toBe('Real Title');
    expect(effectiveDescription(t)).toBe('Real summary.');
    const meta = tutorialMetadata(t);
    expect(meta.alternates?.canonical).toContain('/linux-tutorials/real-title');
  });

  it('uses custom SEO fields when present', () => {
    const t = createTutorial(
      {
        title: 'Title', summary: 'sum', content: 'c', difficulty: 'Beginner',
        distribution: 'Ubuntu', author: 'A', status: 'published', tags: [],
        seoTitle: 'Custom SEO Title', seoDescription: 'Custom description.',
      },
      db,
    );
    expect(effectiveTitle(t)).toBe('Custom SEO Title');
    expect(effectiveDescription(t)).toBe('Custom description.');
  });
});
