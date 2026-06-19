import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson, currentApiAdmin, unauthorized } from '@/lib/cms/api';
import { listCategories, createCategory } from '@/lib/cms/tutorials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!currentApiAdmin()) return unauthorized();
  return NextResponse.json({ categories: listCategories() });
}

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  let body: { name?: unknown };
  try {
    body = (await readJson(request, 2_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });

  return NextResponse.json({ ok: true, category: createCategory(name) }, { status: 201 });
}
