import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { TOOLS, CATEGORIES } from '@/lib/tools';
import { listLatestPublished } from '@/lib/cms/tutorials';

// Dynamic so newly published tutorials appear in the sitemap without a rebuild.
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = ['', '/tools', '/about', '/privacy', '/terms', '/contact', '/linux-tutorials'].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  // Only published tutorials are included; drafts and previews are excluded.
  let tutorialPages: MetadataRoute.Sitemap = [];
  try {
    tutorialPages = listLatestPublished(1000).map((t) => ({
      url: absoluteUrl(`/linux-tutorials/${t.slug}`),
      lastModified: new Date(t.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    tutorialPages = [];
  }

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

  return [...staticPages, ...categoryPages, ...toolPages, ...tutorialPages];
}
