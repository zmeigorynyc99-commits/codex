import { defaultLocale, type Locale } from './config';
import en, { type Dictionary } from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = {
  en,
};

/** Returns the UI dictionary for a locale, falling back to the default. */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Dictionary };
