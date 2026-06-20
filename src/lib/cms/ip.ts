import crypto from 'node:crypto';

/**
 * Privacy-preserving IP fingerprint for moderation/abuse tracking.
 * Server-only (imports node:crypto) — kept out of community.ts so that
 * isomorphic helpers there can be imported by client components.
 */
export function hashIp(ip: string): string {
  const salt = process.env.CMS_IP_SALT || 'botera-cms';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16);
}
