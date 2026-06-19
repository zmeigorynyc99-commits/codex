import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson, badRequest, currentApiAdmin, unauthorized } from '@/lib/cms/api';
import { validateTutorialInput } from '@/lib/cms/validation';
import { getTutorialById, updateTutorial, deleteTutorial } from '@/lib/cms/tutorials';
import { CMS_LIMITS } from '@/lib/cms/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseId(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!currentApiAdmin()) return unauthorized();
  const id = parseId(params);
  if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const tutorial = getTutorialById(id);
  if (!tutorial) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ tutorial });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;
  const id = parseId(params);
  if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: unknown;
  try {
    body = await readJson(request, CMS_LIMITS.content + 50_000);
  } catch {
    return NextResponse.json({ error: 'Invalid or oversized payload.' }, { status: 400 });
  }

  const validation = validateTutorialInput(body);
  if (!validation.ok || !validation.value) return badRequest(validation.errors);

  const tutorial = updateTutorial(id, validation.value);
  if (!tutorial) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, tutorial });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;
  const id = parseId(params);
  if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ok = deleteTutorial(id);
  return NextResponse.json({ ok });
}
