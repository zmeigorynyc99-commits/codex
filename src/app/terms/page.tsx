import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { Prose } from '@/components/Prose';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `The terms that apply when you use ${siteConfig.name}. The tools are provided free of charge and on an "as is" basis.`,
  alternates: { canonical: absoluteUrl('/terms') },
};

export default function TermsPage() {
  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Terms of Use' }]} />
      <h1 className="mb-2 text-center text-3xl font-bold">Terms of Use</h1>
      <p className="mb-6 text-center text-sm text-slate-500">Last updated: 19 June 2026</p>
      <Prose>
        <p>
          By accessing or using {siteConfig.name} (the “Service”), you agree to these Terms of Use. If
          you do not agree, please do not use the Service.
        </p>

        <h2>Use of the tools</h2>
        <p>
          The tools are provided for general informational and personal productivity purposes. You may
          use them for lawful purposes only. You are responsible for the data you enter and for how you
          use the results.
        </p>

        <h2>No professional advice</h2>
        <p>
          The tools — including the BMI, loan and other calculators — provide general estimates and
          information, not professional, financial, medical, legal or other advice. Results may be
          rounded or simplified. Always verify important figures and consult a qualified professional
          before making decisions that rely on them.
        </p>

        <h2>“As is” and availability</h2>
        <p>
          The Service is provided “as is” and “as available”, without warranties of any kind, whether
          express or implied, including accuracy, fitness for a particular purpose or uninterrupted
          availability. We may change, suspend or discontinue any part of the Service at any time.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any direct, indirect,
          incidental or consequential damages arising from your use of, or inability to use, the
          Service or the results it produces.
        </p>

        <h2>Intellectual property</h2>
        <p>
          The site’s design, text and original code are the property of {siteConfig.name} or its
          licensors. You may use the tools and their output freely; you may not copy the site’s
          content wholesale or present it as your own.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may revise these Terms from time to time. Continued use of the Service after changes
          take effect constitutes acceptance of the revised Terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these Terms? Please use our <a href="/contact">Contact</a> page.
        </p>
      </Prose>
    </div>
  );
}
