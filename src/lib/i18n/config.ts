/**
 * Internationalisation configuration.
 *
 * The site ships with English only, but the architecture is ready for more
 * languages: add a locale code here, create a dictionary under
 * ./dictionaries, and (optionally) introduce a `[locale]` route segment.
 * UI strings live in the dictionaries; per-tool content can be extended with
 * a `translations` map on each tool definition in src/lib/tools.ts.
 */
export const locales = ['en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
