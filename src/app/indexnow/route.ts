import { indexNowKey } from '@/lib/cms/indexnow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serves the IndexNow key for ownership verification (keyLocation target). */
export async function GET() {
  const key = indexNowKey();
  if (!key) return new Response('Not found', { status: 404 });
  return new Response(key, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}
