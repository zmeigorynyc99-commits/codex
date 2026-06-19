import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { TOOLS, CATEGORIES } from '@/lib/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = ['', '/tools', '/about', '/privacy', '/terms', '/contact'].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const categoryPages = CATEGORIES.map((category) => ({
    url: absoluteUrl(`/category/${category.id}`),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const toolPages = TOOLS.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
