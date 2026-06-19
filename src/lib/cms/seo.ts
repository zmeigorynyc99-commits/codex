import type { Metadata } from 'next';
import type { Tutorial } from './types';
import { absoluteUrl, siteConfig } from '@/lib/site';

/** Effective SEO title: custom SEO title, else tutorial title. */
export function effectiveTitle(t: Tutorial): string {
  return (t.seoTitle && t.seoTitle.trim()) || t.title;
}

/** Effective SEO description: custom, else summary, else a generated fallback. */
export function effectiveDescription(t: Tutorial): string {
  const desc = (t.seoDescription && t.seoDescription.trim()) || t.summary.trim();
  if (desc) return desc.slice(0, 200);
  return `A ${t.difficulty.toLowerCase()} Linux tutorial for ${t.distribution}: ${t.title}.`;
}

/** Builds Next.js Metadata for a published tutorial page. */
export function tutorialMetadata(t: Tutorial): Metadata {
  const url = absoluteUrl(`/linux-tutorials/${t.slug}`);
  const title = effectiveTitle(t);
  const description = effectiveDescription(t);
  const images = t.coverImage
    ? [{ url: t.coverImage }]
    : [{ url: absoluteUrl('/og-default.svg'), width: 1200, height: 630, alt: t.title }];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: siteConfig.name,
      publishedTime: t.publishedAt ?? undefined,
      modifiedTime: t.updatedAt,
      authors: t.author ? [t.author] : undefined,
      tags: t.tags.map((tag) => tag.name),
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

/** Article + BreadcrumbList JSON-LD for a tutorial. */
export function tutorialJsonLd(t: Tutorial) {
  const url = absoluteUrl(`/linux-tutorials/${t.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: effectiveTitle(t),
    description: effectiveDescription(t),
    author: { '@type': 'Person', name: t.author || siteConfig.name },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    datePublished: t.publishedAt ?? t.createdAt,
    dateModified: t.updatedAt,
    mainEntityOfPage: url,
    url,
    ...(t.coverImage ? { image: t.coverImage } : {}),
    articleSection: t.category?.name,
    keywords: t.tags.map((tag) => tag.name).join(', '),
    proficiencyLevel: t.difficulty,
  };
}

export function tutorialBreadcrumbJsonLd(t: Tutorial) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Linux Tutorials', item: absoluteUrl('/linux-tutorials') },
      { '@type': 'ListItem', position: 3, name: t.title, item: absoluteUrl(`/linux-tutorials/${t.slug}`) },
    ],
  };
}
