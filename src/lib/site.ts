/** Global site configuration derived from environment variables. */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export const siteConfig = {
  name: 'Tiny Tools',
  shortName: 'TinyTools',
  tagline: 'Fast, free, privacy-friendly online tools',
  description:
    'A free collection of fast, privacy-friendly browser tools: calculators, converters, text utilities and generators. No sign-up, no tracking, works offline-friendly in your browser.',
  url: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'https://tinytools.example'),
  locale: 'en',
  themeColor: '#2563eb',
  twitterHandle: '@tinytools',
  analytics: {
    domain: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || '',
    src: process.env.NEXT_PUBLIC_ANALYTICS_SRC || '',
  },
  donateUrl: process.env.NEXT_PUBLIC_DONATE_URL || '',
  // "Buy me a coffee" / one-dollar support links (optional, external).
  coffeeUrl: process.env.NEXT_PUBLIC_COFFEE_URL || '',
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || '',
  enableAds: process.env.NEXT_PUBLIC_ENABLE_ADS === 'true',
} as const;

export function absoluteUrl(path = ''): string {
  if (!path) return siteConfig.url;
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}
