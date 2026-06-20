import { NextResponse } from 'next/server';
import { clientIp } from '@/lib/cms/api';
import { guardPublicSubmission } from '@/lib/cms/abuse';
import { toggleLike, likeCount } from '@/lib/cms/likes';
import { getTutorialById } from '@/lib/cms/tutorials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Same-origin + rate limit + block check (no honeypot needed for a toggle).
  const guard = guardPublicSubmission(request, {}, { action: 'like', limit: 30, windowMs: 600_000 });
  if (guard) return guard;

  const tutorial = getTutorialById(id);
  if (!tutorial || tutorial.status !== 'published') {
    return NextResponse.json({ error: 'Not available' }, { status: 400 });
  }

  const ip = clientIp();
  if (!ip || ip === 'unknown') {
    return NextResponse.json({ liked: false, count: likeCount(id) });
  }
  return NextResponse.json(toggleLike(id, ip));
}
