import {
  CMS_LIMITS,
  isDifficulty,
  isDistribution,
  isStatus,
} from './constants';
import type { TutorialInput } from './types';
import { slugify } from './slug';

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  value?: TutorialInput;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Validates and normalises raw tutorial input from an admin form/API request.
 * This never trusts the client: it bounds lengths, checks enums and coerces
 * types. Content sanitisation happens separately at render time.
 */
export function validateTutorialInput(raw: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const data = (raw ?? {}) as Record<string, unknown>;

  const title = str(data.title).trim();
  if (!title) errors.title = 'Title is required.';
  if (title.length > CMS_LIMITS.title) errors.title = `Title must be at most ${CMS_LIMITS.title} characters.`;

  let slug = slugify(str(data.slug).trim() || title);
  if (!slug) errors.slug = 'A valid slug could not be generated from the title.';
  if (slug.length > CMS_LIMITS.slug) slug = slug.slice(0, CMS_LIMITS.slug);

  const summary = str(data.summary).trim();
  if (summary.length > CMS_LIMITS.summary) errors.summary = `Summary must be at most ${CMS_LIMITS.summary} characters.`;

  const content = str(data.content);
  if (content.length > CMS_LIMITS.content) errors.content = `Content is too large (max ${CMS_LIMITS.content} characters).`;

  const difficulty = data.difficulty;
  if (!isDifficulty(difficulty)) errors.difficulty = 'Choose a valid difficulty.';

  const distribution = data.distribution;
  if (!isDistribution(distribution)) errors.distribution = 'Choose a valid Linux distribution.';

  const status = data.status;
  if (!isStatus(status)) errors.status = 'Status must be draft or published.';

  const author = str(data.author).trim().slice(0, CMS_LIMITS.author);

  const coverImageRaw = str(data.coverImage).trim();
  let coverImage: string | null = coverImageRaw ? coverImageRaw.slice(0, CMS_LIMITS.coverImageUrl) : null;
  if (coverImage && !isSafeImageRef(coverImage)) {
    errors.coverImage = 'Cover image must be an http(s) URL or an uploaded image path.';
    coverImage = null;
  }

  const seoTitle = str(data.seoTitle).trim().slice(0, CMS_LIMITS.seoTitle) || null;
  const seoDescription = str(data.seoDescription).trim().slice(0, CMS_LIMITS.seoDescription) || null;

  let categoryId: number | null = null;
  if (data.categoryId !== undefined && data.categoryId !== null && data.categoryId !== '') {
    const n = Number(data.categoryId);
    categoryId = Number.isInteger(n) && n > 0 ? n : null;
  }

  let tags: string[] = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags;
  } else if (typeof data.tags === 'string') {
    tags = data.tags.split(',');
  }
  tags = tags
    .map((t) => str(t).trim())
    .filter(Boolean)
    .slice(0, CMS_LIMITS.tagsPerTutorial);

  const featured = data.featured === true || data.featured === 'true' || data.featured === 'on' || data.featured === 1;

  let publishedAt: string | null = null;
  if (typeof data.publishedAt === 'string' && data.publishedAt.trim()) {
    const d = new Date(data.publishedAt);
    publishedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const ok = Object.keys(errors).length === 0;
  if (!ok) return { ok, errors };

  return {
    ok,
    errors,
    value: {
      title,
      slug,
      summary,
      content,
      coverImage,
      categoryId,
      tags,
      difficulty: difficulty as TutorialInput['difficulty'],
      distribution: distribution as TutorialInput['distribution'],
      author,
      seoTitle,
      seoDescription,
      status: status as TutorialInput['status'],
      featured,
      publishedAt,
    },
  };
}

/** Accepts http(s) URLs or internal upload paths only (no javascript:, data:, etc.). */
export function isSafeImageRef(value: string): boolean {
  if (value.startsWith('/uploads/') || value.startsWith('/api/uploads/')) {
    return !value.includes('..');
  }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
