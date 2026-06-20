import { NextResponse } from 'next/server';
import { readJson, clientIp } from '@/lib/cms/api';
import { guardPublicSubmission } from '@/lib/cms/abuse';
import { normalizeLine, normalizePlainText, classifyContent, UGC_LIMITS } from '@/lib/cms/community';
import { hashIp } from '@/lib/cms/ip';
import { createReply } from '@/lib/cms/forum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const threadId = Number(params.id);
  if (!Number.isInteger(threadId) || threadId <= 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 20_000)) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const guard = guardPublicSubmission(request, body, { action: 'forum-reply', limit: 8, windowMs: 600_000 });
  if (guard) return guard;

  const author = normalizeLine(body.authorName, UGC_LIMITS.name, 'Anonymous');
  const content = normalizePlainText(body.body, UGC_LIMITS.replyBody);
  if (content.length < 2) return NextResponse.json({ error: 'Please write a longer reply.' }, { status: 400 });

  const status = classifyContent(content);
  const reply = createReply(threadId, { authorName: author, body: content, status, ipHash: hashIp(clientIp()) });
  if (!reply) return NextResponse.json({ error: 'This thread is closed or does not exist.' }, { status: 400 });

  return NextResponse.json({ ok: true, pending: status !== 'approved' }, { status: 201 });
}
