import { listLatestPublished } from '@/lib/cms/tutorials';
import { buildRssFeed } from '@/lib/cms/rss';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const tutorials = listLatestPublished(30);
  const xml = buildRssFeed(tutorials);
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
