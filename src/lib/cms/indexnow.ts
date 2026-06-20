import { absoluteUrl, siteConfig } from '@/lib/site';

/**
 * IndexNow lets us instantly notify Bing, Yandex and other participating
 * engines when a URL is published or updated (free; Google does not use
 * IndexNow but still benefits from the sitemap + crawlability). Enabled only
 * when INDEXNOW_KEY is set. The key is also served at /indexnow for ownership.
 */
export function indexNowKey(): string {
  return process.env.INDEXNOW_KEY || '';
}

/** Notifies IndexNow about updated URLs. Fire-and-forget; never throws. */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = indexNowKey();
  if (!key || urls.length === 0) return;
  try {
    const host = new URL(siteConfig.url).host;
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: absoluteUrl('/indexnow'),
        urlList: urls.slice(0, 1000),
      }),
      // Don't let a slow endpoint hold up the admin response for long.
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* best-effort: indexing pings must never break publishing */
  }
}
