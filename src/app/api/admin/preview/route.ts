import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson } from '@/lib/cms/api';
import { renderMarkdown } from '@/lib/cms/markdown';
import { CMS_LIMITS } from '@/lib/cms/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns sanitised HTML for live editor preview. Never executes content. */
export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  let body: { content?: unknown };
  try {
    body = (await readJson(request, CMS_LIMITS.content + 10_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid or oversized payload.' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.slice(0, CMS_LIMITS.content) : '';
  return NextResponse.json({ html: renderMarkdown(content) });
}
