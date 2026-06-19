import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  TOOLS,
  getTool,
  getCategory,
  getRelatedTools,
  allToolSlugs,
} from '@/lib/tools';
import { toolMetadata, toolJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { ToolRenderer } from '@/components/tools/ToolRenderer';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FaqList } from '@/components/FaqList';
import { ToolCard } from '@/components/ToolCard';
import { AdSlot } from '@/components/AdSlot';

export function generateStaticParams() {
  return allToolSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tool = getTool(params.slug);
  if (!tool) return {};
  return toolMetadata(tool);
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getTool(params.slug);
  if (!tool) notFound();

  const category = getCategory(tool.category)!;
  const related = getRelatedTools(tool);

  return (
    <div className="container-content py-8">
      <JsonLd data={toolJsonLd(tool)} />
      <JsonLd data={faqJsonLd(tool)} />
      <JsonLd data={breadcrumbJsonLd(tool, category.name)} />

      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: category.name, href: `/category/${category.id}` },
          { name: tool.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <header className="mb-6">
            <h1 className="text-3xl font-bold">{tool.heading}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{tool.description}</p>
          </header>

          <ToolRenderer component={tool.component} />

          <section aria-labelledby="about-heading" className="mt-10">
            <h2 id="about-heading" className="text-xl font-bold">About this tool</h2>
            <div className="mt-3 space-y-3 text-slate-600 dark:text-slate-400">
              {tool.explanation.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="examples-heading" className="mt-8">
            <h2 id="examples-heading" className="text-xl font-bold">Examples</h2>
            <ul className="mt-3 space-y-2">
              {tool.examples.map((example, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-mono text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {example}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="faq-heading" className="mt-8">
            <h2 id="faq-heading" className="text-xl font-bold">Frequently asked questions</h2>
            <div className="mt-3">
              <FaqList items={tool.faq} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p className="font-medium text-slate-900 dark:text-white">🔒 Private by design</p>
            <p className="mt-1">Everything runs in your browser. Your data never leaves your device.</p>
          </div>
          <AdSlot format="rectangle" />
          {related.length > 0 && (
            <nav aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Related tools
              </h2>
              <ul className="mt-3 space-y-2">
                {related.map((rt) => (
                  <li key={rt.slug}>
                    <Link
                      href={`/tools/${rt.slug}`}
                      className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-brand-300"
                    >
                      {rt.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
      </div>

      <section className="mt-12 lg:hidden">
        <h2 className="sr-only">More tools</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {related.map((rt) => (
            <ToolCard key={rt.slug} tool={rt} />
          ))}
        </div>
      </section>
    </div>
  );
}
