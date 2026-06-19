/** Slug generation and uniqueness helpers. */

/** Converts arbitrary text into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 200);
}

/**
 * Returns a slug that does not collide with existing ones. `exists` should
 * report whether a candidate slug is already taken (optionally ignoring the
 * tutorial currently being edited). Appends -2, -3, … on collision.
 */
export function uniqueSlug(base: string, exists: (slug: string) => boolean): string {
  const root = slugify(base) || 'tutorial';
  if (!exists(root)) return root;
  let n = 2;
  while (exists(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
