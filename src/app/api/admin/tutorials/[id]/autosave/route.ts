import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson } from '@/lib/cms/api';
import { autosaveTutorial } from '@/lib/cms/tutorials';
import { CMS_LIMITS } from '@/lib/cms/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: { title?: string; summary?: string; content?: string };
  try {
    body = (await readJson(request, CMS_LIMITS.content + 10_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid or oversized payload.' }, { status: 400 });
  }

  const patch = {
    title: typeof body.title === 'string' ? body.title.slice(0, CMS_LIMITS.title) : undefined,
    summary: typeof body.summary === 'string' ? body.summary.slice(0, CMS_LIMITS.summary) : undefined,
    content: typeof body.content === 'string' ? body.content.slice(0, CMS_LIMITS.content) : undefined,
  };

  const ok = autosaveTutorial(id, patch);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
