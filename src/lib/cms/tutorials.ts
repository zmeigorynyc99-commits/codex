import type Database from 'better-sqlite3';
import { getDb } from './db';
import { slugify, uniqueSlug } from './slug';
import type { Category, Tag, Tutorial, TutorialInput } from './types';
import type { Difficulty, Distribution, Status } from './constants';

type DB = Database.Database;

interface TutorialRow {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image: string | null;
  category_id: number | null;
  difficulty: string;
  distribution: string;
  author: string;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  featured: number;
  lesson_order: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function toIso(sqliteDate: string): string {
  // SQLite datetime('now') is 'YYYY-MM-DD HH:MM:SS' in UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(sqliteDate)) {
    return new Date(`${sqliteDate.replace(' ', 'T')}Z`).toISOString();
  }
  const d = new Date(sqliteDate);
  return Number.isNaN(d.getTime()) ? sqliteDate : d.toISOString();
}

function getCategory(db: DB, id: number | null): Category | null {
  if (!id) return null;
  const row = db.prepare('SELECT id, name, slug FROM categories WHERE id = ?').get(id) as Category | undefined;
  return row ?? null;
}

function getTags(db: DB, tutorialId: number): Tag[] {
  return db
    .prepare(
      `SELECT t.id, t.name, t.slug FROM tags t
       JOIN tutorial_tags tt ON tt.tag_id = t.id
       WHERE tt.tutorial_id = ? ORDER BY t.name`,
    )
    .all(tutorialId) as Tag[];
}

function mapRow(db: DB, row: TutorialRow): Tutorial {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    coverImage: row.cover_image,
    categoryId: row.category_id,
    category: getCategory(db, row.category_id),
    tags: getTags(db, row.id),
    difficulty: row.difficulty as Difficulty,
    distribution: row.distribution as Distribution,
    author: row.author,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status as Status,
    featured: row.featured === 1,
    lessonOrder: row.lesson_order ?? null,
    publishedAt: row.published_at ? toIso(row.published_at) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function slugExists(slug: string, excludeId?: number, db: DB = getDb()): boolean {
  const row = excludeId
    ? db.prepare('SELECT 1 FROM tutorials WHERE slug = ? AND id != ?').get(slug, excludeId)
    : db.prepare('SELECT 1 FROM tutorials WHERE slug = ?').get(slug);
  return Boolean(row);
}

/** Resolves tag names to ids, creating any that do not yet exist. */
function ensureTags(db: DB, names: string[]): number[] {
  const insert = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
  const find = db.prepare('SELECT id FROM tags WHERE slug = ?');
  const ids: number[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    insert.run(name.trim(), slug);
    const row = find.get(slug) as { id: number } | undefined;
    if (row) ids.push(row.id);
  }
  return [...new Set(ids)];
}

function setTutorialTags(db: DB, tutorialId: number, names: string[]): void {
  db.prepare('DELETE FROM tutorial_tags WHERE tutorial_id = ?').run(tutorialId);
  const link = db.prepare('INSERT OR IGNORE INTO tutorial_tags (tutorial_id, tag_id) VALUES (?, ?)');
  for (const tagId of ensureTags(db, names)) link.run(tutorialId, tagId);
}

function saveRevision(db: DB, tutorialId: number): void {
  const current = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(tutorialId);
  if (current) {
    db.prepare('INSERT INTO tutorial_revisions (tutorial_id, snapshot) VALUES (?, ?)').run(
      tutorialId,
      JSON.stringify(current),
    );
    // Keep only the 20 most recent revisions per tutorial.
    db.prepare(
      `DELETE FROM tutorial_revisions WHERE tutorial_id = ? AND id NOT IN (
         SELECT id FROM tutorial_revisions WHERE tutorial_id = ? ORDER BY id DESC LIMIT 20
       )`,
    ).run(tutorialId, tutorialId);
  }
}

export function createTutorial(input: TutorialInput, db: DB = getDb()): Tutorial {
  const slug = uniqueSlug(input.slug || input.title, (s) => slugExists(s, undefined, db));
  const publishedAt =
    input.status === 'published' ? input.publishedAt ?? new Date().toISOString() : input.publishedAt ?? null;

  const result = db
    .prepare(
      `INSERT INTO tutorials
        (title, slug, summary, content, cover_image, category_id, difficulty, distribution,
         author, seo_title, seo_description, status, featured, published_at)
       VALUES (@title, @slug, @summary, @content, @cover_image, @category_id, @difficulty, @distribution,
         @author, @seo_title, @seo_description, @status, @featured, @published_at)`,
    )
    .run({
      title: input.title,
      slug,
      summary: input.summary,
      content: input.content,
      cover_image: input.coverImage ?? null,
      category_id: input.categoryId ?? null,
      difficulty: input.difficulty,
      distribution: input.distribution,
      author: input.author,
      seo_title: input.seoTitle ?? null,
      seo_description: input.seoDescription ?? null,
      status: input.status,
      featured: input.featured ? 1 : 0,
      published_at: publishedAt,
    });

  const id = Number(result.lastInsertRowid);
  setTutorialTags(db, id, input.tags ?? []);
  return getTutorialById(id, db)!;
}

export function updateTutorial(id: number, input: TutorialInput, db: DB = getDb()): Tutorial | null {
  const existing = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(id) as TutorialRow | undefined;
  if (!existing) return null;

  saveRevision(db, id);

  // Keep the slug stable unless the admin explicitly changes it.
  let slug = existing.slug;
  const desired = slugify(input.slug || '');
  if (desired && desired !== existing.slug) {
    slug = uniqueSlug(desired, (s) => slugExists(s, id, db));
  }

  let publishedAt = existing.published_at;
  if (input.status === 'published' && !existing.published_at) {
    publishedAt = input.publishedAt ?? new Date().toISOString();
  } else if (input.publishedAt !== undefined && input.publishedAt !== null) {
    publishedAt = input.publishedAt;
  }

  db.prepare(
    `UPDATE tutorials SET
      title = @title, slug = @slug, summary = @summary, content = @content,
      cover_image = @cover_image, category_id = @category_id, difficulty = @difficulty,
      distribution = @distribution, author = @author, seo_title = @seo_title,
      seo_description = @seo_description, status = @status, featured = @featured,
      published_at = @published_at, updated_at = datetime('now')
     WHERE id = @id`,
  ).run({
    id,
    title: input.title,
    slug,
    summary: input.summary,
    content: input.content,
    cover_image: input.coverImage ?? null,
    category_id: input.categoryId ?? null,
    difficulty: input.difficulty,
    distribution: input.distribution,
    author: input.author,
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
    status: input.status,
    featured: input.featured ? 1 : 0,
    published_at: publishedAt,
  });

  setTutorialTags(db, id, input.tags ?? []);
  return getTutorialById(id, db);
}

/** Lightweight content/title save for autosave — does not create a revision. */
export function autosaveTutorial(
  id: number,
  patch: { title?: string; summary?: string; content?: string },
  db: DB = getDb(),
): boolean {
  const existing = db.prepare('SELECT id FROM tutorials WHERE id = ?').get(id);
  if (!existing) return false;
  db.prepare(
    `UPDATE tutorials SET
       title = COALESCE(@title, title),
       summary = COALESCE(@summary, summary),
       content = COALESCE(@content, content),
       updated_at = datetime('now')
     WHERE id = @id`,
  ).run({ id, title: patch.title ?? null, summary: patch.summary ?? null, content: patch.content ?? null });
  return true;
}

export function setStatus(id: number, status: Status, db: DB = getDb()): Tutorial | null {
  const existing = db.prepare('SELECT published_at FROM tutorials WHERE id = ?').get(id) as
    | { published_at: string | null }
    | undefined;
  if (!existing) return null;
  const publishedAt =
    status === 'published' && !existing.published_at ? new Date().toISOString() : existing.published_at;
  db.prepare("UPDATE tutorials SET status = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    publishedAt,
    id,
  );
  return getTutorialById(id, db);
}

export function setFeatured(id: number, featured: boolean, db: DB = getDb()): void {
  db.prepare("UPDATE tutorials SET featured = ?, updated_at = datetime('now') WHERE id = ?").run(
    featured ? 1 : 0,
    id,
  );
}

export function deleteTutorial(id: number, db: DB = getDb()): boolean {
  const result = db.prepare('DELETE FROM tutorials WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getTutorialById(id: number, db: DB = getDb()): Tutorial | null {
  const row = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(id) as TutorialRow | undefined;
  return row ? mapRow(db, row) : null;
}

export function getTutorialBySlug(
  slug: string,
  options: { publishedOnly?: boolean } = {},
  db: DB = getDb(),
): Tutorial | null {
  const row = db.prepare('SELECT * FROM tutorials WHERE slug = ?').get(slug) as TutorialRow | undefined;
  if (!row) return null;
  if (options.publishedOnly && row.status !== 'published') return null;
  return mapRow(db, row);
}

export interface ListFilters {
  status?: Status;
  publishedOnly?: boolean;
  category?: string; // category slug
  tag?: string; // tag slug
  difficulty?: Difficulty;
  distribution?: Distribution;
  featured?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: 'published' | 'updated';
}

export interface ListResult {
  items: Tutorial[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function listTutorials(filters: ListFilters = {}, db: DB = getDb()): ListResult {
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.publishedOnly) {
    where.push("t.status = 'published'");
  } else if (filters.status) {
    where.push('t.status = @status');
    params.status = filters.status;
  }
  if (filters.featured !== undefined) {
    where.push('t.featured = @featured');
    params.featured = filters.featured ? 1 : 0;
  }
  if (filters.difficulty) {
    where.push('t.difficulty = @difficulty');
    params.difficulty = filters.difficulty;
  }
  if (filters.distribution) {
    where.push('t.distribution = @distribution');
    params.distribution = filters.distribution;
  }
  if (filters.category) {
    where.push('t.category_id = (SELECT id FROM categories WHERE slug = @category)');
    params.category = filters.category;
  }
  if (filters.tag) {
    where.push(
      't.id IN (SELECT tt.tutorial_id FROM tutorial_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tg.slug = @tag)',
    );
    params.tag = filters.tag;
  }
  if (filters.search && filters.search.trim()) {
    where.push('(t.title LIKE @q OR t.summary LIKE @q OR t.content LIKE @q)');
    params.q = `%${filters.search.trim().replace(/[%_]/g, (m) => `\\${m}`)}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order =
    filters.orderBy === 'updated'
      ? 't.updated_at DESC'
      : "COALESCE(t.published_at, t.created_at) DESC";

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM tutorials t ${whereSql}`).get(params) as { n: number }
  ).n;

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 9));
  const offset = (page - 1) * pageSize;

  const rows = db
    .prepare(`SELECT t.* FROM tutorials t ${whereSql} ORDER BY ${order} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: pageSize, offset }) as TutorialRow[];

  return {
    items: rows.map((r) => mapRow(db, r)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Newest published tutorials for the homepage feed and RSS. */
export function listLatestPublished(limit = 5, db: DB = getDb()): Tutorial[] {
  const rows = db
    .prepare(
      "SELECT * FROM tutorials WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?",
    )
    .all(limit) as TutorialRow[];
  return rows.map((r) => mapRow(db, r));
}

// ---- Course carousel (ordered, de-duplicated lesson sequence) ----

/** Normalised key used to detect duplicate lessons regardless of database id. */
function lessonCanonicalKey(t: Tutorial): string {
  return t.title
    .replace(/^lesson\s+\d+\s*[·:.\-]\s*/i, '') // drop any "Lesson N · " index prefix
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Higher score = more complete; used to keep the best copy of a duplicate. */
function lessonCompleteness(t: Tutorial): number {
  return (t.content?.length ?? 0) + (t.coverImage ? 100_000 : 0) + (t.summary ? 1_000 : 0);
}

export interface CourseFilters {
  search?: string;
  category?: string; // category slug
  difficulty?: Difficulty;
  distribution?: Distribution;
}

/**
 * Returns the published curriculum lessons as a single ordered course sequence:
 * sorted numerically by `lesson_order`, with duplicates removed (by canonical
 * title/slug/content, not just id), keeping exactly one complete copy of each.
 * This is the canonical source for the lessons carousel — any filtering happens
 * after de-duplication so filters can never reintroduce duplicate cards.
 */
export function listCourseLessons(filters: CourseFilters = {}, db: DB = getDb()): Tutorial[] {
  const rows = db
    .prepare(
      `SELECT * FROM tutorials
       WHERE status = 'published' AND lesson_order IS NOT NULL
       ORDER BY lesson_order ASC, id ASC`,
    )
    .all() as TutorialRow[];

  // De-duplicate: collapse rows that resolve to the same canonical lesson,
  // keeping the most complete copy (and the lowest lesson_order on ties).
  const bySlug = new Map<string, Tutorial>();
  const byCanonical = new Map<string, Tutorial>();
  for (const row of rows) {
    const t = mapRow(db, row);
    if (bySlug.has(t.slug)) continue; // slug is unique in DB, but guard anyway
    bySlug.set(t.slug, t);
    const key = lessonCanonicalKey(t);
    const existing = byCanonical.get(key);
    if (!existing || lessonCompleteness(t) > lessonCompleteness(existing)) {
      byCanonical.set(key, t);
    }
  }

  let items = [...byCanonical.values()].sort((a, b) => {
    const ao = a.lessonOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.lessonOrder ?? Number.MAX_SAFE_INTEGER;
    return ao - bo || a.id - b.id;
  });

  // Apply filters AFTER de-duplication and ordering.
  if (filters.difficulty) items = items.filter((t) => t.difficulty === filters.difficulty);
  if (filters.distribution) items = items.filter((t) => t.distribution === filters.distribution);
  if (filters.category) items = items.filter((t) => t.category?.slug === filters.category);
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q),
    );
  }

  return items;
}

/**
 * Published tutorials that are NOT part of the numbered course (no lesson_order) —
 * e.g. long-form standalone guides. Surfaced separately from the lesson carousel
 * so they remain reachable without polluting the ordered sequence.
 */
export function listStandaloneGuides(db: DB = getDb()): Tutorial[] {
  const rows = db
    .prepare(
      `SELECT * FROM tutorials
       WHERE status = 'published' AND lesson_order IS NULL
       ORDER BY COALESCE(published_at, created_at) DESC`,
    )
    .all() as TutorialRow[];
  return rows.map((r) => mapRow(db, r));
}

export function listFeaturedPublished(limit = 3, db: DB = getDb()): Tutorial[] {
  const rows = db
    .prepare(
      "SELECT * FROM tutorials WHERE status = 'published' AND featured = 1 ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?",
    )
    .all(limit) as TutorialRow[];
  return rows.map((r) => mapRow(db, r));
}

/** Previous/next published tutorials by publication date for in-article nav. */
export function getAdjacent(
  tutorial: Tutorial,
  db: DB = getDb(),
): { prev: Tutorial | null; next: Tutorial | null } {
  const pivot = tutorial.publishedAt ?? tutorial.createdAt;
  const prevRow = db
    .prepare(
      `SELECT * FROM tutorials WHERE status = 'published' AND COALESCE(published_at, created_at) < ? AND id != ?
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`,
    )
    .get(pivot, tutorial.id) as TutorialRow | undefined;
  const nextRow = db
    .prepare(
      `SELECT * FROM tutorials WHERE status = 'published' AND COALESCE(published_at, created_at) > ? AND id != ?
       ORDER BY COALESCE(published_at, created_at) ASC LIMIT 1`,
    )
    .get(pivot, tutorial.id) as TutorialRow | undefined;
  return {
    prev: prevRow ? mapRow(db, prevRow) : null,
    next: nextRow ? mapRow(db, nextRow) : null,
  };
}

/** Related published tutorials: same category first, then shared tags. */
export function getRelated(tutorial: Tutorial, limit = 3, db: DB = getDb()): Tutorial[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT t.* FROM tutorials t
       LEFT JOIN tutorial_tags tt ON tt.tutorial_id = t.id
       WHERE t.status = 'published' AND t.id != @id
         AND (t.category_id = @categoryId
              OR tt.tag_id IN (SELECT tag_id FROM tutorial_tags WHERE tutorial_id = @id))
       ORDER BY (t.category_id = @categoryId) DESC, COALESCE(t.published_at, t.created_at) DESC
       LIMIT @limit`,
    )
    .all({ id: tutorial.id, categoryId: tutorial.categoryId ?? -1, limit }) as TutorialRow[];
  return rows.map((r) => mapRow(db, r));
}

export function listRevisions(tutorialId: number, db: DB = getDb()): Array<{ id: number; createdAt: string }> {
  return (
    db
      .prepare('SELECT id, created_at FROM tutorial_revisions WHERE tutorial_id = ? ORDER BY id DESC')
      .all(tutorialId) as Array<{ id: number; created_at: string }>
  ).map((r) => ({ id: r.id, createdAt: toIso(r.created_at) }));
}

// ---- Categories & tags ----

export function listCategories(db: DB = getDb()): Category[] {
  return db.prepare('SELECT id, name, slug FROM categories ORDER BY name').all() as Category[];
}

export function createCategory(name: string, db: DB = getDb()): Category {
  const slug = slugify(name);
  db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)').run(name.trim(), slug);
  return db.prepare('SELECT id, name, slug FROM categories WHERE slug = ?').get(slug) as Category;
}

export function deleteCategory(id: number, db: DB = getDb()): boolean {
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;
}

export function listTags(db: DB = getDb()): Tag[] {
  return db.prepare('SELECT id, name, slug FROM tags ORDER BY name').all() as Tag[];
}

/** Tags that are actually used by at least one published tutorial. */
export function listPublishedTags(db: DB = getDb()): Tag[] {
  return db
    .prepare(
      `SELECT DISTINCT tg.id, tg.name, tg.slug FROM tags tg
       JOIN tutorial_tags tt ON tt.tag_id = tg.id
       JOIN tutorials t ON t.id = tt.tutorial_id
       WHERE t.status = 'published' ORDER BY tg.name`,
    )
    .all() as Tag[];
}
