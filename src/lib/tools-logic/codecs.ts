/** URL and Base64 encode/decode helpers that are safe for Unicode text. */

export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrl(text: string): string {
  // decodeURIComponent throws on malformed input; callers handle the error.
  return decodeURIComponent(text);
}

export function encodeUrlComponentPlus(text: string): string {
  return encodeURIComponent(text).replace(/%20/g, '+');
}

/** UTF-8 safe Base64 encoding (works in browser and Node). */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(text, 'utf-8').toString('base64');
}

/** UTF-8 safe Base64 decoding. Throws on invalid Base64. */
export function decodeBase64(encoded: string): string {
  const cleaned = encoded.trim();
  if (typeof atob === 'function') {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  return Buffer.from(cleaned, 'base64').toString('utf-8');
}

export function encodeBase64Url(text: string): string {
  return encodeBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Url(encoded: string): string {
  let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) padded += '=';
  return decodeBase64(padded);
}
