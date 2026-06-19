import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse } from '@/lib/cms/api';
import { deleteCategory } from '@/lib/cms/tutorials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: deleteCategory(id) });
}
