#!/usr/bin/env node
/**
 * Creates (or updates the password of) an admin account for the Linux
 * Tutorials CMS. Self-contained: it only needs better-sqlite3 and Node's
 * crypto, so it works on the host or inside the app container.
 *
 * The hash format matches src/lib/cms/auth.ts exactly:
 *   scrypt$<base64 salt>$<base64 hash(keylen 64)>
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password>
 *   ADMIN_EMAIL=a@b.c ADMIN_PASSWORD=secret node scripts/create-admin.mjs
 *
 * The database path follows CMS_DB_PATH (default ./data/cms.db).
 */
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  console.error('   or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const dbPath = (process.env.CMS_DB_PATH || path.join(process.cwd(), 'data', 'cms.db')).trim();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Idempotent: matches migration 1. The app applies the rest of the schema on boot.
db.exec(`CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(password, salt, 64);
const hash = `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;

const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email);
if (existing) {
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE email = ?').run(hash, email);
  console.log(`Updated password for existing admin: ${email}`);
} else {
  db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(email, hash);
  console.log(`Created admin account: ${email}`);
}

db.close();
console.log(`Database: ${dbPath}`);
