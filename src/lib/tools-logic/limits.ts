/**
 * Shared input-size limits and a tiny guard helper.
 *
 * Every tool that accepts free-form text enforces a maximum length to protect
 * the browser (and, for any server interaction, the server) from pathological
 * inputs. These are deliberately generous for normal use but bounded.
 */
export const INPUT_LIMITS = {
  /** Single-line text fields (names, numbers, short strings). */
  shortText: 2_000,
  /** Multi-line text areas (counter, dedupe, case converter, JSON, base64). */
  longText: 100_000,
  /** Maximum characters encoded into a QR code. */
  qrText: 2_000,
} as const;

/**
 * Truncates a string to a maximum length. Returns the original string when it
 * is already within bounds. Never throws.
 */
export function clampText(value: string, max: number): string {
  if (typeof value !== 'string') return '';
  return value.length > max ? value.slice(0, max) : value;
}
