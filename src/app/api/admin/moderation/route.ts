import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson } from '@/lib/cms/api';
import { setThreadStatus, setReplyStatus, setThreadFlags, deleteThread, deleteReply } from '@/lib/cms/forum';
import { setCommentStatus, deleteComment } from '@/lib/cms/comments';
import { setMessageStatus, deleteMessage, type MessageStatus } from '@/lib/cms/messages';
import type { ModerationStatus } from '@/lib/cms/community';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin-only moderation actions for community content. */
export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  let body: { entity?: unknown; id?: unknown; action?: unknown };
  try {
    body = (await readJson(request, 2_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const entity = String(body.entity);
  const id = Number(body.id);
  const action = String(body.action);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const asStatus = (a: string): ModerationStatus | null =>
    a === 'approve' ? 'approved' : a === 'hide' ? 'hidden' : a === 'pending' ? 'pending' : null;

  switch (entity) {
    case 'thread': {
      if (action === 'delete') return NextResponse.json({ ok: deleteThread(id) });
      if (action === 'pin' || action === 'unpin') {
        setThreadFlags(id, { pinned: action === 'pin' });
        return NextResponse.json({ ok: true });
      }
      if (action === 'lock' || action === 'unlock') {
        setThreadFlags(id, { locked: action === 'lock' });
        return NextResponse.json({ ok: true });
      }
      const status = asStatus(action);
      if (status) {
        setThreadStatus(id, status);
        return NextResponse.json({ ok: true });
      }
      break;
    }
    case 'reply': {
      if (action === 'delete') return NextResponse.json({ ok: deleteReply(id) });
      const status = asStatus(action);
      if (status) {
        setReplyStatus(id, status);
        return NextResponse.json({ ok: true });
      }
      break;
    }
    case 'comment': {
      if (action === 'delete') return NextResponse.json({ ok: deleteComment(id) });
      const status = asStatus(action);
      if (status) {
        setCommentStatus(id, status);
        return NextResponse.json({ ok: true });
      }
      break;
    }
    case 'message': {
      if (action === 'delete') return NextResponse.json({ ok: deleteMessage(id) });
      if (action === 'read' || action === 'archived' || action === 'new') {
        setMessageStatus(id, action as MessageStatus);
        return NextResponse.json({ ok: true });
      }
      break;
    }
  }

  return NextResponse.json({ error: 'Unknown entity or action.' }, { status: 400 });
}
