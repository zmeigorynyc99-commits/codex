import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from './site';
import type { ToolDefinition } from './tools';

/** Builds Next.js Metadata for a tool page, including canonical and OG tags. */
export function toolMetadata(tool: ToolDefinition): Metadata {
  const url = absoluteUrl(`/tools/${tool.slug}`);
  const title = tool.title;
  return {
    title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${tool.title} · ${siteConfig.name}`,
      description: tool.description,
      siteName: siteConfig.name,
      images: [{ url: absoluteUrl('/og-default.svg'), width: 1200, height: 630, alt: tool.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.title} · ${siteConfig.name}`,
      description: tool.description,
      images: [absoluteUrl('/og-default.svg')],
    },
  };
}

/** JSON-LD: WebApplication describing a tool. */
export function toolJsonLd(tool: ToolDefinition) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: absoluteUrl(`/tools/${tool.slug}`),
    description: tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  };
}

/** JSON-LD: FAQPage built from a tool's FAQ list. */
export function faqJsonLd(tool: ToolDefinition) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** JSON-LD: BreadcrumbList for a tool page. */
export function breadcrumbJsonLd(tool: ToolDefinition, categoryName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: categoryName, item: absoluteUrl(`/category/${tool.category}`) },
      { '@type': 'ListItem', position: 3, name: tool.name, item: absoluteUrl(`/tools/${tool.slug}`) },
    ],
  };
}

/** JSON-LD: the site as a WebSite with a search action. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
