import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '@/lib/cms/db';
import { createTutorial, listCourseLessons } from '@/lib/cms/tutorials';
import type { TutorialInput } from '@/lib/cms/types';

let db: Database.Database;

function make(
  title: string,
  order: number | null,
  overrides: Partial<TutorialInput> = {},
  content = '# Lesson\n\nReasonably complete content body for the lesson.',
) {
  const t = createTutorial(
    {
      title,
      summary: 'Summary.',
      content,
      difficulty: 'Beginner',
      distribution: 'Ubuntu',
      author: 'botera',
      status: 'published',
      tags: [],
      ...overrides,
    },
    db,
  );
  db.prepare('UPDATE tutorials SET lesson_order = ? WHERE id = ?').run(order, t.id);
  return t;
}

beforeEach(() => {
  db = createTestDb();
});

describe('listCourseLessons', () => {
  it('returns only published, lesson_order rows in numeric order', () => {
    make('Lesson 3 · Gamma', 103);
    make('Lesson 1 · Alpha', 101);
    make('Lesson 2 · Beta', 102);
    make('Draft lesson', 104, { status: 'draft' });
    make('Not a course tutorial', null);

    const lessons = listCourseLessons({}, db);
    expect(lessons.map((l) => l.lessonOrder)).toEqual([101, 102, 103]);
    expect(lessons.map((l) => l.title)).toEqual([
      'Lesson 1 · Alpha',
      'Lesson 2 · Beta',
      'Lesson 3 · Gamma',
    ]);
  });

  it('sorts numerically, not alphabetically (10 after 9)', () => {
    make('Lesson 9 · Nine', 109);
    make('Lesson 10 · Ten', 110);
    make('Lesson 1 · One', 101);
    const lessons = listCourseLessons({}, db);
    expect(lessons.map((l) => l.lessonOrder)).toEqual([101, 109, 110]);
  });

  it('de-duplicates by canonical title, keeping the most complete copy', () => {
    // Same canonical lesson ("Alpha"), different slug + lesson_order + completeness.
    make('Lesson 1 · Alpha', 101, {}, 'short');
    make('Lesson 1 · Alpha', 201, { coverImage: '/cover.svg' }, '# Alpha\n\nMuch longer, complete body.');
    make('Lesson 2 · Beta', 102);

    const lessons = listCourseLessons({}, db);
    // Two unique lessons, not three.
    expect(lessons).toHaveLength(2);
    const alpha = lessons.find((l) => l.title === 'Lesson 1 · Alpha')!;
    // Kept the more complete copy (the one with a cover image).
    expect(alpha.coverImage).toBe('/cover.svg');
  });

  it('applies filters AFTER de-duplication so filters never re-introduce duplicates', () => {
    make('Lesson 1 · Alpha', 101, { difficulty: 'Beginner' });
    make('Lesson 2 · Beta', 102, { difficulty: 'Advanced' });
    make('Lesson 2 · Beta', 202, { difficulty: 'Advanced', coverImage: '/c.svg' }, '# Beta long body');

    const advanced = listCourseLessons({ difficulty: 'Advanced' }, db);
    expect(advanced).toHaveLength(1);
    expect(advanced[0].title).toBe('Lesson 2 · Beta');

    const search = listCourseLessons({ search: 'alpha' }, db);
    expect(search.map((l) => l.title)).toEqual(['Lesson 1 · Alpha']);
  });
});
