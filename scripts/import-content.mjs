#!/usr/bin/env node
/**
 * Curriculum importer for the botera learning platform.
 *
 * Reads every lesson under `content/curriculum/<track>/*.md` (markdown with
 * front matter) and upserts it into the CMS `tutorials` table, so the whole
 * catalogue loads automatically — no manual admin uploads. It is:
 *
 *   - Idempotent: a per-lesson content hash means unchanged files are skipped.
 *   - Non-destructive: it only ever touches tutorials it created itself
 *     (tracked in `imported_content`). Hand-written admin tutorials are safe.
 *   - Self-contained: like create-admin.mjs it talks to SQLite directly, so it
 *     runs on the host or inside the standalone container before the server.
 *
 * Usage:
 *   node scripts/import-content.mjs            # sync all lessons
 *   node scripts/import-content.mjs --prune    # also delete imported lessons
 *                                              # whose source file was removed
 *   CMS_DB_PATH=./data/cms.db node scripts/import-content.mjs
 */
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'curriculum');
const DB_PATH = (process.env.CMS_DB_PATH || path.join(ROOT, 'data', 'cms.db')).trim();
const PRUNE = process.argv.includes('--prune');

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Senior', 'Expert'];
const DISTRIBUTIONS = ['Ubuntu', 'Debian', 'CentOS', 'Fedora', 'Arch', 'General Linux', 'Windows', 'Cross-platform'];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

function ensureSchema(db) {
  // Subset of migration 1 needed for content, created defensively so the
  // importer can run before the app boots. The app's own migrations remain
  // the source of truth and are idempotent against these.
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS tutorials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover_image TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      difficulty TEXT NOT NULL DEFAULT 'Beginner',
      distribution TEXT NOT NULL DEFAULT 'General Linux',
      author TEXT NOT NULL DEFAULT '',
      seo_title TEXT,
      seo_description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      featured INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tutorial_tags (
      tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (tutorial_id, tag_id)
    );
    -- Tracks importer-owned lessons so re-imports are idempotent and pruning
    -- never deletes hand-written admin tutorials.
    CREATE TABLE IF NOT EXISTS imported_content (
      slug TEXT PRIMARY KEY,
      source_path TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      tutorial_id INTEGER,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// A lesson is a .md file inside a track directory. README.md and files starting
// with an underscore are documentation, not lessons, and are ignored.
function isLessonFile(name) {
  return name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_');
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && isLessonFile(entry.name)) out.push(full);
  }
  return out;
}

function ensureCategory(db, name) {
  if (!name) return null;
  const slug = slugify(name);
  db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)').run(name.trim(), slug);
  const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  return row ? row.id : null;
}

function setTags(db, tutorialId, names) {
  db.prepare('DELETE FROM tutorial_tags WHERE tutorial_id = ?').run(tutorialId);
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
  const findTag = db.prepare('SELECT id FROM tags WHERE slug = ?');
  const link = db.prepare('INSERT OR IGNORE INTO tutorial_tags (tutorial_id, tag_id) VALUES (?, ?)');
  const seen = new Set();
  for (const raw of names || []) {
    const name = String(raw).trim();
    const slug = slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    insertTag.run(name, slug);
    const row = findTag.get(slug);
    if (row) link.run(tutorialId, row.id);
  }
}

function normalizeLesson(data, body, file) {
  const rel = path.relative(ROOT, file);
  const errors = [];

  const title = (data.title || '').toString().trim();
  if (!title) errors.push('missing title');

  const slug = slugify(data.slug || title);
  if (!slug) errors.push('missing/invalid slug');

  const difficulty = (data.difficulty || data.level || 'Beginner').toString().trim();
  if (!DIFFICULTIES.includes(difficulty)) errors.push(`invalid difficulty "${difficulty}"`);

  let distribution = (data.distribution || 'General Linux').toString().trim();
  if (!DISTRIBUTIONS.includes(distribution)) distribution = 'General Linux';

  const status = (data.status || 'published').toString().trim() === 'draft' ? 'draft' : 'published';

  const summary = (data.summary || '').toString().trim().slice(0, 500);
  if (!summary) errors.push('missing summary');
  if (!body || body.trim().length < 400) errors.push('body too short');

  const tags = Array.isArray(data.tags)
    ? data.tags
    : (data.tags ? String(data.tags).split(',').map((s) => s.trim()) : []);

  return {
    rel,
    errors,
    record: {
      title,                    // base title; a "Lesson N · " index is prepended later
      slug,
      summary,
      content: body,
      cover_image: (data.cover || data.coverImage || null) || null,
      category: (data.category || data.trackName || '').toString().trim(),
      // Track grouping for the per-track "Lesson N" index.
      track: (data.track || data.trackName || data.category || 'general').toString().trim(),
      difficulty,
      distribution,
      author: (data.author || 'botera').toString().trim().slice(0, 120),
      seo_title: (data.seoTitle || title).toString().slice(0, 70),
      seo_description: (data.seoDescription || summary).toString().slice(0, 200),
      status,
      featured: data.featured === true ? 1 : 0,
      tags,
      order: Number.isFinite(data.order) ? data.order : 0,
    },
  };
}

function main() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  ensureSchema(db);

  const files = walk(CONTENT_DIR).sort();
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  const seenSlugs = new Set();
  const problems = [];

  const findImport = db.prepare('SELECT content_hash, tutorial_id FROM imported_content WHERE slug = ?');
  const findTutorialBySlug = db.prepare('SELECT id FROM tutorials WHERE slug = ?');
  const recordImport = db.prepare(
    `INSERT INTO imported_content (slug, source_path, content_hash, tutorial_id, updated_at)
     VALUES (@slug, @source_path, @content_hash, @tutorial_id, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET
       source_path = excluded.source_path,
       content_hash = excluded.content_hash,
       tutorial_id = excluded.tutorial_id,
       updated_at = datetime('now')`,
  );

  // Pass 1: parse and validate every lesson into memory (no DB writes yet) so we
  // can assign a per-track "Lesson N" index based on each lesson's `order`.
  const lessons = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const { data, body } = parseFrontmatter(text);
    const { rel, errors, record } = normalizeLesson(data, body, file);
    if (errors.length) {
      problems.push(`${rel}: ${errors.join(', ')}`);
      skipped += 1;
      continue;
    }
    if (seenSlugs.has(record.slug)) {
      problems.push(`${rel}: duplicate slug "${record.slug}"`);
      skipped += 1;
      continue;
    }
    seenSlugs.add(record.slug);
    lessons.push({ rel, record });
  }

  // Pass 2: number lessons within each track (sorted by `order`, then slug) and
  // prepend a stable "Lesson N · " index to the displayed title.
  const byTrack = new Map();
  for (const lesson of lessons) {
    const key = lesson.record.track || 'general';
    if (!byTrack.has(key)) byTrack.set(key, []);
    byTrack.get(key).push(lesson);
  }
  for (const group of byTrack.values()) {
    group.sort((a, b) =>
      a.record.order - b.record.order || a.record.slug.localeCompare(b.record.slug),
    );
    group.forEach((lesson, i) => {
      const baseTitle = lesson.record.title.replace(/^Lesson\s+\d+\s+·\s+/, '');
      lesson.record.lessonIndex = i + 1;
      lesson.record.title = `Lesson ${i + 1} · ${baseTitle}`;
    });
  }

  const sync = db.transaction(() => {
    for (const { rel, record } of lessons) {
      const hash = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
      const prior = findImport.get(record.slug);
      const categoryId = ensureCategory(db, record.category);
      const publishedAt = record.status === 'published' ? "datetime('now')" : null;

      if (prior && prior.content_hash === hash && prior.tutorial_id) {
        // Confirm the tutorial still exists; if so, nothing to do.
        const still = db.prepare('SELECT 1 FROM tutorials WHERE id = ?').get(prior.tutorial_id);
        if (still) {
          unchanged += 1;
          continue;
        }
      }

      const existing = findTutorialBySlug.get(record.slug);
      if (existing) {
        db.prepare(
          `UPDATE tutorials SET
             title=@title, summary=@summary, content=@content, cover_image=@cover_image,
             category_id=@category_id, difficulty=@difficulty, distribution=@distribution,
             author=@author, seo_title=@seo_title, seo_description=@seo_description,
             status=@status, featured=@featured, updated_at=datetime('now')
           WHERE id=@id`,
        ).run({ ...record, category_id: categoryId, id: existing.id });
        if (record.status === 'published') {
          db.prepare(
            "UPDATE tutorials SET published_at = COALESCE(published_at, datetime('now')) WHERE id = ?",
          ).run(existing.id);
        }
        setTags(db, existing.id, record.tags);
        recordImport.run({ slug: record.slug, source_path: rel, content_hash: hash, tutorial_id: existing.id });
        updated += 1;
      } else {
        const result = db
          .prepare(
            `INSERT INTO tutorials
               (title, slug, summary, content, cover_image, category_id, difficulty, distribution,
                author, seo_title, seo_description, status, featured, published_at)
             VALUES
               (@title, @slug, @summary, @content, @cover_image, @category_id, @difficulty, @distribution,
                @author, @seo_title, @seo_description, @status, @featured, ${publishedAt ?? 'NULL'})`,
          )
          .run({ ...record, category_id: categoryId });
        const id = Number(result.lastInsertRowid);
        setTags(db, id, record.tags);
        recordImport.run({ slug: record.slug, source_path: rel, content_hash: hash, tutorial_id: id });
        created += 1;
      }
    }

    if (PRUNE) {
      const owned = db.prepare('SELECT slug, tutorial_id FROM imported_content').all();
      for (const row of owned) {
        if (!seenSlugs.has(row.slug)) {
          if (row.tutorial_id) db.prepare('DELETE FROM tutorials WHERE id = ?').run(row.tutorial_id);
          db.prepare('DELETE FROM imported_content WHERE slug = ?').run(row.slug);
        }
      }
    }
  });

  sync();
  db.close();

  console.log(
    `[import-content] ${files.length} files · created ${created} · updated ${updated} · ` +
      `unchanged ${unchanged} · skipped ${skipped}${PRUNE ? ' · pruned removed lessons' : ''}`,
  );
  if (problems.length) {
    console.warn(`[import-content] ${problems.length} problem(s):`);
    for (const p of problems.slice(0, 50)) console.warn('  - ' + p);
    // Non-fatal: a bad single lesson must not break a deploy.
  }
  console.log(`[import-content] database: ${DB_PATH}`);
}

main();
