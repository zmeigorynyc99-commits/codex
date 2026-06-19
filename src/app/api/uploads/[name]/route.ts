import { NextResponse } from 'next/server';
import { readUpload } from '@/lib/cms/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serves uploaded images from the data directory with traversal protection. */
export async function GET(_request: Request, { params }: { params: { name: string } }) {
  const file = readUpload(params.name);
  if (!file) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(file.buffer, {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
