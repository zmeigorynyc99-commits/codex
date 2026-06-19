import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '@/lib/cms/db';
import {
  hashPassword,
  verifyPassword,
  createAdmin,
  verifyLogin,
  createSession,
  getSessionUser,
  destroySession,
  generateCsrfToken,
  verifyCsrf,
  countAdmins,
} from '@/lib/cms/auth';

let db: Database.Database;
beforeEach(() => {
  db = createTestDb();
});

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', () => {
    const hash = hashPassword('correct horse battery staple');
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('produces a different hash each time (random salt)', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });
});

describe('admin accounts & login', () => {
  it('creates an admin and authenticates valid credentials', () => {
    createAdmin('Admin@Example.com', 'Sup3rSecret!', db);
    expect(countAdmins(db)).toBe(1);
    const user = verifyLogin('admin@example.com', 'Sup3rSecret!', db);
    expect(user?.email).toBe('admin@example.com');
  });

  it('rejects an unknown user or bad password', () => {
    createAdmin('admin@example.com', 'Sup3rSecret!', db);
    expect(verifyLogin('nobody@example.com', 'x', db)).toBeNull();
    expect(verifyLogin('admin@example.com', 'wrong', db)).toBeNull();
  });
});

describe('sessions', () => {
  it('round-trips a session token to a user', () => {
    const user = createAdmin('admin@example.com', 'pw12345678', db);
    const token = createSession(user.id, db);
    expect(getSessionUser(token, db)?.id).toBe(user.id);
  });

  it('returns null for an unknown or destroyed token', () => {
    const user = createAdmin('admin@example.com', 'pw12345678', db);
    const token = createSession(user.id, db);
    destroySession(token, db);
    expect(getSessionUser(token, db)).toBeNull();
    expect(getSessionUser('made-up', db)).toBeNull();
    expect(getSessionUser(undefined, db)).toBeNull();
  });
});

describe('csrf', () => {
  it('accepts matching tokens and rejects mismatches', () => {
    const token = generateCsrfToken();
    expect(verifyCsrf(token, token)).toBe(true);
    expect(verifyCsrf(token, generateCsrfToken())).toBe(false);
    expect(verifyCsrf(undefined, token)).toBe(false);
    expect(verifyCsrf(token, null)).toBe(false);
  });
});
