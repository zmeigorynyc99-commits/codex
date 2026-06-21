import { NextResponse } from 'next/server';
import { guardMutation, isNextResponse } from '@/lib/cms/api';
import { saveImage } from '@/lib/cms/uploads';
import { CMS_LIMITS } from '@/lib/cms/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (isNextResponse(guard)) return guard;

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > CMS_LIMITS.uploadBytes + 200_000) {
    return NextResponse.json({ error: 'File too large (max 5 MB).' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = saveImage(buffer, file.type);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, url: result.url });
}
