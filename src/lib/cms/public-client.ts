'use client';

export interface PublicResult {
  ok: boolean;
  status: number;
  pending?: boolean;
  slug?: string;
  error?: string;
}

/** Posts JSON to a public endpoint (same-origin). Honeypot field included by caller. */
export async function postPublic(url: string, payload: Record<string, unknown>): Promise<PublicResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    let data: { pending?: boolean; slug?: string; error?: string } = {};
    try {
      data = await response.json();
    } catch {
      /* no body */
    }
    return { ok: response.ok, status: response.status, pending: data.pending, slug: data.slug, error: data.error };
  } catch {
    return { ok: false, status: 0, error: 'Network error. Please try again.' };
  }
}
