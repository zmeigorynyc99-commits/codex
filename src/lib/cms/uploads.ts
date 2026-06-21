import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_IMAGE_TYPES, CMS_LIMITS } from './constants';

export function uploadDir(): string {
  const configured = process.env.CMS_UPLOAD_DIR;
  return configured && configured.trim()
    ? configured.trim()
    : path.join(process.cwd(), 'data', 'uploads');
}

export interface SaveResult {
  ok: boolean;
  error?: string;
  filename?: string;
  url?: string;
}

/** Validates and stores an uploaded image, returning its public URL path. */
export function saveImage(buffer: Buffer, mimeType: string): SaveResult {
  const ext = ALLOWED_IMAGE_TYPES[mimeType];
  if (!ext) {
    return { ok: false, error: 'Unsupported file type. Allowed: PNG, JPEG, WebP, GIF, SVG.' };
  }
  if (buffer.length === 0) return { ok: false, error: 'Empty file.' };
  if (buffer.length > CMS_LIMITS.uploadBytes) {
    return { ok: false, error: 'File too large (max 5 MB).' };
  }

  // Random, server-generated filename: prevents path traversal and collisions.
  const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  const dir = uploadDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    return { ok: false, error: `Could not save the file on the server (${reason}).` };
  }
  return { ok: true, filename, url: `/api/uploads/${filename}` };
}

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

/** Safely resolves an uploaded file by name, rejecting path traversal. */
export function readUpload(name: string): { buffer: Buffer; contentType: string } | null {
  // Only a bare filename of the form <hex>.<ext> is ever valid.
  if (!/^[a-f0-9]{32}\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name)) return null;
  const dir = uploadDir();
  const full = path.join(dir, name);
  // Defence in depth: ensure the resolved path stays inside the upload dir.
  if (!full.startsWith(path.resolve(dir) + path.sep) && path.resolve(full) !== path.join(path.resolve(dir), name)) {
    return null;
  }
  if (!fs.existsSync(full)) return null;
  const ext = name.split('.').pop()!.toLowerCase();
  return { buffer: fs.readFileSync(full), contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream' };
}
