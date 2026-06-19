import type { Tutorial } from './types';
import { absoluteUrl, siteConfig } from '@/lib/site';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Builds an RSS 2.0 document for the given published tutorials. */
export function buildRssFeed(tutorials: Tutorial[]): string {
  const feedUrl = absoluteUrl('/linux-tutorials/rss.xml');
  const now = new Date().toUTCString();

  const items = tutorials
    .map((t) => {
      const url = absoluteUrl(`/linux-tutorials/${t.slug}`);
      const date = new Date(t.publishedAt ?? t.createdAt).toUTCString();
      const category = t.category?.name ?? 'Linux';
      return `    <item>
      <title>${escapeXml(t.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(t.summary || t.seoDescription || '')}</description>
      <category>${escapeXml(category)}</category>
      <pubDate>${date}</pubDate>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${siteConfig.name} — Linux Tutorials`)}</title>
    <link>${escapeXml(absoluteUrl('/linux-tutorials'))}</link>
    <description>${escapeXml('Latest Linux administration tutorials and guides.')}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
