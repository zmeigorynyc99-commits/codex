/** Shared constants and enums for the Linux Tutorials CMS. */

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DISTRIBUTIONS = [
  'Ubuntu',
  'Debian',
  'CentOS',
  'Fedora',
  'Arch',
  'General Linux',
] as const;
export type Distribution = (typeof DISTRIBUTIONS)[number];

export const STATUSES = ['draft', 'published'] as const;
export type Status = (typeof STATUSES)[number];

/** Default seed categories. Admins can add more via the dashboard. */
export const DEFAULT_CATEGORIES: Array<{ name: string; slug: string }> = [
  { name: 'Getting Started', slug: 'getting-started' },
  { name: 'System Administration', slug: 'system-administration' },
  { name: 'Networking', slug: 'networking' },
  { name: 'Security', slug: 'security' },
  { name: 'Web Servers', slug: 'web-servers' },
  { name: 'Containers & Docker', slug: 'containers-docker' },
  { name: 'Shell & Scripting', slug: 'shell-scripting' },
  { name: 'Storage & Filesystems', slug: 'storage-filesystems' },
];

/** Limits used for validation and to bound stored input. */
export const CMS_LIMITS = {
  title: 200,
  slug: 200,
  summary: 500,
  content: 200_000,
  seoTitle: 70,
  seoDescription: 200,
  author: 120,
  coverImageUrl: 2_000,
  tagsPerTutorial: 20,
  uploadBytes: 3 * 1024 * 1024, // 3 MB
} as const;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);
}

export function isDistribution(value: unknown): value is Distribution {
  return typeof value === 'string' && (DISTRIBUTIONS as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}
