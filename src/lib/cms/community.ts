/** Length limits for all public, user-generated content (characters). */
export const UGC_LIMITS = {
  name: 60,
  contact: 140,
  subject: 150,
  threadTitle: 150,
  threadBody: 8_000,
  replyBody: 5_000,
  commentBody: 3_000,
  messageBody: 5_000,
} as const;

export type ModerationStatus = 'approved' | 'pending' | 'hidden';

// Control characters to strip, except tab (\x09) and newline (\x0A).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Normalises untrusted text into safe plain text. This does NOT produce HTML:
 * the result is stored raw and later rendered by React as escaped text, so it
 * cannot inject markup or scripts. We additionally strip control characters,
 * collapse excessive blank lines and clamp the length.
 */
export function normalizePlainText(input: unknown, max: number): string {
  let text = typeof input === 'string' ? input : '';
  text = text.replace(CONTROL_CHARS, '');
  text = text.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n');
  text = text.trim();
  if (text.length > max) text = text.slice(0, max);
  return text;
}

/** Cleans a short single-line field (name, subject, contact). */
export function normalizeLine(input: unknown, max: number, fallback = ''): string {
  let text = typeof input === 'string' ? input : '';
  text = text.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim();
  if (text.length > max) text = text.slice(0, max);
  return text || fallback;
}

const SPAM_PATTERNS = [
  /\bviagra\b/i,
  /\bcasino\b/i,
  /\bporn\b/i,
  /\bcrypto\s*(giveaway|airdrop|pump)\b/i,
  /\b(bit\.ly|tinyurl\.com|t\.me)\b/i,
  /\[url=/i,
  /<a\s+href/i,
];

/**
 * Decides the initial moderation status for a submission. Content with many
 * links or obvious spam markers is held as `pending` (invisible to the public
 * until an admin approves it); everything else is `approved` immediately.
 */
export function classifyContent(body: string): ModerationStatus {
  const linkCount = (body.match(/https?:\/\//gi) || []).length;
  if (linkCount >= 3) return 'pending';
  if (SPAM_PATTERNS.some((re) => re.test(body))) return 'pending';
  return 'approved';
}
