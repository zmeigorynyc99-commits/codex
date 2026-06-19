import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/lib/site';
import { Prose } from '@/components/Prose';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with the ${siteConfig.name} team to report a bug, suggest a tool or ask a question.`,
  alternates: { canonical: absoluteUrl('/contact') },
};

export default function ContactPage() {
  return (
    <div className="container-content py-10">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Contact' }]} />
      <h1 className="mb-6 text-center text-3xl font-bold">Contact us</h1>
      <Prose>
        <p>
          We’d love to hear from you. Whether you’ve found a bug, want to suggest a new tool, or have
          a question about how something works, here is how to reach us.
        </p>

        <h2>Email</h2>
        <p>
          The quickest way to get in touch is by email. Replace the address below with your project’s
          real contact address before launch:
        </p>
        <p>
          <a href="mailto:hello@tinytools.example">hello@tinytools.example</a>
        </p>

        <h2>Reporting a problem</h2>
        <p>When reporting an issue, it helps to include:</p>
        <ul>
          <li>The name of the tool you were using.</li>
          <li>What you expected to happen and what actually happened.</li>
          <li>Your browser and operating system, if you know them.</li>
        </ul>
        <p>
          Please do not include sensitive personal information in your message — remember that the
          tools themselves never send us your data, and we’d like to keep your contact messages
          minimal too.
        </p>

        <h2>Suggesting a tool</h2>
        <p>
          Have an idea for a utility that would fit {siteConfig.name}? Tell us what it should do and
          who it would help. Small, focused, browser-based tools are the best fit.
        </p>
      </Prose>
    </div>
  );
}
