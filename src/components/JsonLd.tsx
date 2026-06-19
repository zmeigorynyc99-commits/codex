import { headers } from 'next/headers';

/**
 * Injects a JSON-LD <script> with the request's CSP nonce. The data must come
 * from trusted, server-side sources (never raw user input).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = headers().get('x-nonce') ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
