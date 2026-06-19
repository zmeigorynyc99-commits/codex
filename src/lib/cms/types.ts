import type { Difficulty, Distribution, Status } from './constants';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/** A tutorial as stored, with resolved category/tags for reading. */
export interface Tutorial {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string | null;
  categoryId: number | null;
  category: Category | null;
  tags: Tag[];
  difficulty: Difficulty;
  distribution: Distribution;
  author: string;
  seoTitle: string | null;
  seoDescription: string | null;
  status: Status;
  featured: boolean;
  publishedAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Fields accepted when creating or updating a tutorial. */
export interface TutorialInput {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  coverImage?: string | null;
  categoryId?: number | null;
  tags?: string[]; // tag names; resolved/created by the repository
  difficulty: Difficulty;
  distribution: Distribution;
  author: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: Status;
  featured?: boolean;
  publishedAt?: string | null;
}

export interface AdminUser {
  id: number;
  email: string;
  createdAt: string;
}
