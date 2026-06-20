import { NextResponse } from 'next/server';
import { readJson, clientIp } from '@/lib/cms/api';
import { guardPublicSubmission } from '@/lib/cms/abuse';
import { normalizeLine, normalizePlainText, UGC_LIMITS } from '@/lib/cms/community';
import { hashIp } from '@/lib/cms/ip';
import { createMessage, type MessageKind } from '@/lib/cms/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 20_000)) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const guard = guardPublicSubmission(request, body, { action: 'contact', limit: 4, windowMs: 600_000 });
  if (guard) return guard;

  const kind: MessageKind = body.kind === 'question' ? 'question' : 'contact';
  const name = normalizeLine(body.name, UGC_LIMITS.name, 'Anonymous');
  const contact = normalizeLine(body.contact, UGC_LIMITS.contact) || null;
  const subject = normalizeLine(body.subject, UGC_LIMITS.subject);
  const content = normalizePlainText(body.body, UGC_LIMITS.messageBody);

  if (content.length < 5) {
    return NextResponse.json({ error: 'Please write a longer message.' }, { status: 400 });
  }

  createMessage({
    kind,
    name,
    contact,
    subject: subject || (kind === 'question' ? 'Question' : 'Message'),
    body: content,
    ipHash: hashIp(clientIp()),
  });

  return NextResponse.json({ ok: true });
}
