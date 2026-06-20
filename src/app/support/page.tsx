import type { Metadata } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site';
import { Prose } from '@/components/Prose';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SupportCta } from '@/components/community/SupportCta';

export const metadata: Metadata = {
  title: 'Support botera',
  description: 'Ways to support botera — a free, ad-light collection of Linux tutorials and browser tools.',
  alternates: { canonical: absoluteUrl('/support') },
};

export default function SupportPage() {
  const hasLinks = Boolean(siteConfig.coffeeUrl || siteConfig.donateUrl || siteConfig.supportUrl);
  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Support' }]} />
      <h1 className="mb-6 text-center text-3xl font-bold">Support botera</h1>
      <div className="mx-auto max-w-2xl">
        <SupportCta />
        <Prose>
          <p className="mt-6">
            botera is free to use, has no sign-up and no invasive tracking. If the tutorials or tools
            have saved you time, a small contribution helps cover the server and keeps new content
            coming. Every coffee is genuinely appreciated — thank you.
          </p>
          {!hasLinks && (
            <p>
              Donation links are being set up. In the meantime, the best way to support the project is
              to share a tutorial that helped you, or start a discussion in the{' '}
              <a href="/forum">community forum</a>.
            </p>
          )}
          <h2>Other ways to help</h2>
          <ul>
            <li>Share a tutorial or tool with someone who would find it useful.</li>
            <li>Answer a question in the <a href="/forum">forum</a>.</li>
            <li>Report a problem or suggest an idea on the <a href="/contact">contact page</a>.</li>
          </ul>
        </Prose>
      </div>
    </div>
  );
}
