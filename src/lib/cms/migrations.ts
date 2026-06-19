/**
 * Ordered schema migrations for the CMS SQLite database.
 *
 * Each migration has a unique, monotonically increasing `id` and a block of
 * SQL. The runner in db.ts records applied migrations in `schema_migrations`
 * and only runs new ones, so this doubles as the migration history.
 */
export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

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

      CREATE INDEX IF NOT EXISTS idx_tutorials_status ON tutorials(status, published_at);
      CREATE INDEX IF NOT EXISTS idx_tutorials_featured ON tutorials(featured);
      CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category_id);

      CREATE TABLE IF NOT EXISTS tutorial_tags (
        tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (tutorial_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS tutorial_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
        snapshot TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_revisions_tutorial ON tutorial_revisions(tutorial_id, created_at);

      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];
