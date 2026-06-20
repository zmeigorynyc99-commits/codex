import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson } from '@/lib/cms/api';
import { setStatus, setFeatured } from '@/lib/cms/tutorials';
import { isStatus } from '@/lib/cms/constants';
import { pingIndexNow } from '@/lib/cms/indexnow';
import { absoluteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: { status?: unknown; featured?: unknown };
  try {
    body = (await readJson(request, 1_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  if (typeof body.featured === 'boolean') {
    setFeatured(id, body.featured);
  }

  if (body.status !== undefined) {
    if (!isStatus(body.status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    const tutorial = setStatus(id, body.status);
    if (!tutorial) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (tutorial.status === 'published') {
      void pingIndexNow([absoluteUrl(`/linux-tutorials/${tutorial.slug}`)]);
    }
    return NextResponse.json({ ok: true, tutorial });
  }

  return NextResponse.json({ ok: true });
}
