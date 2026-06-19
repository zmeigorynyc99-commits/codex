import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { Prose } from '@/components/Prose';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} handles your data: no accounts, no tracking cookies, and all tool processing happens locally in your browser.`,
  alternates: { canonical: absoluteUrl('/privacy') },
};

export default function PrivacyPage() {
  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Privacy Policy' }]} />
      <h1 className="mb-2 text-center text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-6 text-center text-sm text-slate-500">Last updated: 19 June 2026</p>
      <Prose>
        <p>
          This Privacy Policy explains how {siteConfig.name} (“we”, “us”) handles information when you
          use this website. In short: the tools run in your browser, and we collect as little as
          possible.
        </p>

        <h2>Information processed in your browser</h2>
        <p>
          The text, numbers and files you enter into a tool are processed locally on your device by
          your web browser. This information is not transmitted to us or to any third party, and we
          never see it, store it, or have access to it.
        </p>

        <h2>Information we do not collect</h2>
        <ul>
          <li>We do not require you to create an account.</li>
          <li>We do not set advertising or tracking cookies by default.</li>
          <li>We do not sell or share personal data, because we do not collect it.</li>
        </ul>

        <h2>Analytics</h2>
        <p>
          If usage analytics are enabled for this site, we use a privacy-friendly, cookie-free
          solution that records aggregate page views without using cookies and without collecting
          information that identifies you. No cross-site tracking takes place. If analytics are not
          enabled, no such script loads at all.
        </p>

        <h2>Server logs</h2>
        <p>
          Like most websites, the server that delivers these pages may keep short-lived technical
          logs (such as IP address and requested page) for security and reliability. These logs are
          used only to operate the service and are rotated regularly.
        </p>

        <h2>Advertising</h2>
        <p>
          This site may display advertising placeholders. Where real advertising is enabled, the
          relevant provider’s own privacy practices will apply to the ad content; we aim to choose
          providers that minimise tracking. Any change here will be reflected in this policy.
        </p>

        <h2>Children’s privacy</h2>
        <p>
          The site is general-purpose and is not directed at children. We do not knowingly collect
          personal information from anyone, including children.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be reflected by updating
          the “Last updated” date above.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy? Please use our <a href="/contact">Contact</a> page.
        </p>
      </Prose>
    </div>
  );
}
