/**
 * Minimal, dependency-free front-matter parser for curriculum lessons.
 *
 * Supports a deliberately small YAML subset that the lesson files use:
 *   - `key: value`            (string / number / boolean)
 *   - quoted strings          ("..." or '...'), preserving colons and #
 *   - inline arrays           (`[a, b, c]` or `["a", "b"]`)
 *   - comments                (a line whose first non-space char is #)
 *
 * It is intentionally strict and predictable so the content-validation test
 * can rely on its behaviour. Anything fancier than the above is not used by
 * the lessons and is treated as a plain string.
 */

function stripQuotes(raw) {
  const s = raw.trim();
  if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function coerceScalar(raw) {
  const s = raw.trim();
  if (s === '') return '';
  // Quoted values are always strings.
  if ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'")) {
    return stripQuotes(s);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return Number.parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return Number.parseFloat(s);
  return s;
}

function parseInlineArray(raw) {
  const inner = raw.trim().slice(1, -1).trim();
  if (inner === '') return [];
  // Split on commas that are not inside quotes.
  const parts = [];
  let current = '';
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ',') {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((p) => coerceScalar(p)).filter((v) => v !== '');
}

/**
 * Parses a markdown document with optional `---` front matter.
 * Returns `{ data, body }` where data is an object of parsed keys.
 */
export function parseFrontmatter(text) {
  const normalized = String(text).replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { data: {}, body: normalized };
  }
  const end = normalized.indexOf('\n---', 4);
  if (end === -1) {
    return { data: {}, body: normalized };
  }
  const headerBlock = normalized.slice(4, end);
  // Body begins after the closing fence line.
  const afterFence = normalized.indexOf('\n', end + 1);
  const body = afterFence === -1 ? '' : normalized.slice(afterFence + 1).replace(/^\n+/, '');

  const data = {};
  for (const line of headerBlock.split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const valueRaw = line.slice(colon + 1).trim();
    if (!key) continue;
    if (valueRaw.startsWith('[') && valueRaw.endsWith(']')) {
      data[key] = parseInlineArray(valueRaw);
    } else {
      data[key] = coerceScalar(valueRaw);
    }
  }
  return { data, body };
}

export default parseFrontmatter;
