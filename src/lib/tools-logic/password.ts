/** Secure password generation using the Web Crypto API. */

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  /** Exclude visually ambiguous characters (l, I, 1, O, 0, etc.). */
  excludeAmbiguous: boolean;
}

const SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};

const AMBIGUOUS = new Set('lI1O0oB8S5Z2|`'.split(''));

export const PASSWORD_LENGTH_MIN = 4;
export const PASSWORD_LENGTH_MAX = 128;

function buildPool(options: PasswordOptions): string[] {
  let pool = '';
  if (options.lowercase) pool += SETS.lowercase;
  if (options.uppercase) pool += SETS.uppercase;
  if (options.numbers) pool += SETS.numbers;
  if (options.symbols) pool += SETS.symbols;
  let chars = pool.split('');
  if (options.excludeAmbiguous) {
    chars = chars.filter((c) => !AMBIGUOUS.has(c));
  }
  return chars;
}

/**
 * Generates a password. Throws when no character set is selected. Uses
 * rejection sampling for unbiased selection.
 */
export function generatePassword(options: PasswordOptions): string {
  const length = Math.min(
    PASSWORD_LENGTH_MAX,
    Math.max(PASSWORD_LENGTH_MIN, Math.floor(options.length)),
  );
  const pool = buildPool(options);
  if (pool.length === 0) {
    throw new Error('Select at least one character type.');
  }

  const out: string[] = [];
  const buffer = new Uint32Array(length * 2);
  const maxUint32 = 0xffffffff;
  const limit = Math.floor((maxUint32 + 1) / pool.length) * pool.length;

  while (out.length < length) {
    globalThis.crypto.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && out.length < length; i += 1) {
      const value = buffer[i]!;
      if (value >= limit) continue;
      out.push(pool[value % pool.length]!);
    }
  }
  return out.join('');
}

export interface StrengthResult {
  /** Estimated entropy in bits. */
  bits: number;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';
  /** 0–4 score for UI meters. */
  score: number;
}

/** Estimates password entropy from its length and character variety. */
export function estimateStrength(password: string): StrengthResult {
  if (!password) return { bits: 0, label: 'Very weak', score: 0 };
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 24;
  const bits = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0;

  let score: number;
  let label: StrengthResult['label'];
  if (bits < 28) {
    score = 0;
    label = 'Very weak';
  } else if (bits < 36) {
    score = 1;
    label = 'Weak';
  } else if (bits < 60) {
    score = 2;
    label = 'Fair';
  } else if (bits < 128) {
    score = 3;
    label = 'Strong';
  } else {
    score = 4;
    label = 'Very strong';
  }
  return { bits, label, score };
}
