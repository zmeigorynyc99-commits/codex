'use client';

/** Reads the readable CSRF cookie set at login. */
export function readCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)tt_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : '';
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/** fetch wrapper that attaches the CSRF token to mutating admin requests. */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('x-csrf-token', readCsrfToken());
    if (!headers.has('content-type') && !(options.body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }
  }
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { ok: response.ok, status: response.status, data: data as T };
}
