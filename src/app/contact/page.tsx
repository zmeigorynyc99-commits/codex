import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/community/ContactForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact & Ask a Question',
  description: `Send a message or ask a question to the ${siteConfig.name} team — entirely on-site, no email required.`,
  alternates: { canonical: absoluteUrl('/contact') },
};

export default function ContactPage() {
  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Contact' }]} />
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-3xl font-bold">Contact &amp; ask a question</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600 dark:text-slate-400">
          Found a bug, have an idea, or want to ask something about a tutorial? Send it here. There is
          no email and no account — your message goes straight to the site owner’s admin inbox.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Prefer a public answer? Ask in the{' '}
          <a href="/forum" className="text-brand-700 hover:underline dark:text-brand-300">community forum</a>{' '}
          instead.
        </p>
      </div>
    </div>
  );
}
