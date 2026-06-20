import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson, badRequest, currentApiAdmin, unauthorized } from '@/lib/cms/api';
import { validateTutorialInput } from '@/lib/cms/validation';
import { createTutorial, listTutorials } from '@/lib/cms/tutorials';
import { CMS_LIMITS } from '@/lib/cms/constants';
import { pingIndexNow } from '@/lib/cms/indexnow';
import { absoluteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!currentApiAdmin()) return unauthorized();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('q') ?? undefined;
  const page = Number(url.searchParams.get('page') ?? '1');
  const result = listTutorials({
    status: status === 'draft' || status === 'published' ? status : undefined,
    search,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 25,
    orderBy: 'updated',
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  let body: unknown;
  try {
    body = await readJson(request, CMS_LIMITS.content + 50_000);
  } catch {
    return NextResponse.json({ error: 'Invalid or oversized payload.' }, { status: 400 });
  }

  const validation = validateTutorialInput(body);
  if (!validation.ok || !validation.value) return badRequest(validation.errors);

  const tutorial = createTutorial(validation.value);
  if (tutorial.status === 'published') {
    void pingIndexNow([absoluteUrl(`/linux-tutorials/${tutorial.slug}`)]);
  }
  return NextResponse.json({ ok: true, tutorial }, { status: 201 });
}
