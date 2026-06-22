import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { MIGRATIONS } from './migrations';
import { DEFAULT_CATEGORIES } from './constants';
import { seedNetworkingTutorial } from './seed-tutorials';

type DB = Database.Database;

let instance: DB | null = null;

function resolveDbPath(): string {
  const configured = process.env.CMS_DB_PATH;
  if (configured && configured.trim()) return configured.trim();
  return path.join(process.cwd(), 'data', 'cms.db');
}

/** Applies any pending migrations and seeds default categories once. */
function migrate(db: DB): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);

  const applied = new Set<number>(
    db.prepare('SELECT id FROM schema_migrations').all().map((r) => (r as { id: number }).id),
  );

  const record = db.prepare('INSERT INTO schema_migrations (id, name) VALUES (?, ?)');
  const runAll = db.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) continue;
      db.exec(migration.sql);
      record.run(migration.id, migration.name);
    }
  });
  runAll();

  // Seed default categories only when the table is empty.
  const count = (db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }).n;
  if (count === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)');
    const seed = db.transaction(() => {
      for (const c of DEFAULT_CATEGORIES) insert.run(c.name, c.slug);
    });
    seed();
  }
}

function open(filePath: string, seedContent = true): DB {
  if (filePath !== ':memory:') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  if (seedContent) seedNetworkingTutorial(db);
  return db;
}

/** Returns the shared database connection, opening + migrating on first use. */
export function getDb(): DB {
  if (!instance) {
    instance = open(resolveDbPath());
  }
  return instance;
}

/** Creates an isolated in-memory database (used by tests). */
export function createTestDb(): DB {
  return open(':memory:', false);
}

/** Resets the shared connection (used by tests). */
export function __resetDbForTests(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
