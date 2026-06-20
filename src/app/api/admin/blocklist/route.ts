import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse, readJson } from '@/lib/cms/api';
import { blockIp, unblockIp } from '@/lib/cms/blocklist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Basic IPv4/IPv6 shape check (storage only — never used to build queries unsafely).
const IP_RE = /^[0-9a-fA-F:.]{3,45}$/;

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  let body: { ip?: unknown; reason?: unknown; action?: unknown };
  try {
    body = (await readJson(request, 2_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const ip = typeof body.ip === 'string' ? body.ip.trim() : '';
  if (!ip || !IP_RE.test(ip)) {
    return NextResponse.json({ error: 'Provide a valid IP address.' }, { status: 400 });
  }

  if (body.action === 'unblock') {
    return NextResponse.json({ ok: unblockIp(ip) });
  }

  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : null;
  blockIp(ip, reason);
  return NextResponse.json({ ok: true });
}
