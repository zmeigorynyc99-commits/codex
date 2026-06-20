import { NextResponse } from 'next/server';
import { readJson, clientIp } from '@/lib/cms/api';
import { guardPublicSubmission } from '@/lib/cms/abuse';
import { normalizeLine, normalizePlainText, classifyContent, UGC_LIMITS } from '@/lib/cms/community';
import { hashIp } from '@/lib/cms/ip';
import { createThread } from '@/lib/cms/forum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 30_000)) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const guard = guardPublicSubmission(request, body, { action: 'forum-thread', limit: 4, windowMs: 600_000 });
  if (guard) return guard;

  const title = normalizeLine(body.title, UGC_LIMITS.threadTitle);
  const author = normalizeLine(body.authorName, UGC_LIMITS.name, 'Anonymous');
  const content = normalizePlainText(body.body, UGC_LIMITS.threadBody);

  if (title.length < 3) return NextResponse.json({ error: 'Please enter a longer title.' }, { status: 400 });
  if (content.length < 5) return NextResponse.json({ error: 'Please write a longer message.' }, { status: 400 });

  const status = classifyContent(`${title}\n${content}`);
  const thread = createThread({ title, authorName: author, body: content, status, ipHash: hashIp(clientIp()) });

  return NextResponse.json({ ok: true, slug: thread.slug, pending: status !== 'approved' }, { status: 201 });
}
