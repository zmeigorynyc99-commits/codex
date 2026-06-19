import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { TOOLS } from '@/lib/tools';
import { Prose } from '@/components/Prose';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'About',
  description: `Learn about ${siteConfig.name}: a free, fast, privacy-friendly collection of browser-based tools with no accounts and no tracking.`,
  alternates: { canonical: absoluteUrl('/about') },
};

export default function AboutPage() {
  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'About' }]} />
      <h1 className="mb-6 text-center text-3xl font-bold">About {siteConfig.name}</h1>
      <Prose>
        <p>
          {siteConfig.name} is a free collection of {TOOLS.length} small, focused utilities that run
          entirely in your web browser. There are no accounts to create, nothing to install, and no
          data to upload. Open a tool, use it, and close the tab — that is the whole experience.
        </p>

        <h2>Why we built it</h2>
        <p>
          Many everyday tasks — calculating a percentage, generating a strong password, formatting a
          chunk of JSON — are surprisingly hard to do online without wading through pop-ups, sign-up
          walls and trackers. We wanted a place where each tool does one job well, loads almost
          instantly, and respects your privacy by default.
        </p>

        <h2>How it works</h2>
        <p>
          Every calculation and conversion happens locally on your device using your browser’s own
          capabilities. Because nothing is sent to a server, the tools are fast and your inputs stay
          private. The site is built as a set of static, pre-rendered pages so it stays lightweight
          and cheap to run — which is part of how we keep it free.
        </p>

        <h2>Privacy first</h2>
        <p>
          We do not require accounts, we do not set tracking cookies, and there is no analytics that
          identifies you. If we ever add usage measurement, it will be a privacy-friendly, cookie-free
          approach that counts page views without collecting personal data. You can read the details
          on our <a href="/privacy">Privacy Policy</a> page.
        </p>

        <h2>Open to feedback</h2>
        <p>
          We are always refining existing tools and adding new ones. If you have spotted a bug or
          would like to suggest a tool, please reach out through the <a href="/contact">Contact</a>{' '}
          page.
        </p>
      </Prose>
    </div>
  );
}
