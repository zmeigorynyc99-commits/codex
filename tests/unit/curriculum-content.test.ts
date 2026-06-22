import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from '@/lib/cms/markdown';
import { DIFFICULTIES, DISTRIBUTIONS } from '@/lib/cms/constants';
// The same parser the importer uses, exercised here so a malformed lesson
// fails CI rather than silently failing to import in production.
import { parseFrontmatter } from '../../scripts/lib/frontmatter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CURRICULUM = path.join(ROOT, 'content', 'curriculum');

// Mirrors the importer: lessons are .md files in track directories; README.md
// and underscore-prefixed files are documentation, not lessons.
function isLessonFile(name: string): boolean {
  return name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_');
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return e.isFile() && isLessonFile(e.name) ? [full] : [];
  });
}

const files = walk(CURRICULUM);

// Headings every lesson must contain (the platform's quality bar: no shallow
// filler). Matched case-insensitively as a markdown heading prefix.
const REQUIRED_SECTIONS = [
  'learning objectives',
  'hands-on lab',
  'exercises',
  'troubleshooting',
  'assessment',
  'solutions',
];

describe('curriculum content', () => {
  it('has lesson files to validate', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  const slugs = new Map<string, string>();

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    describe(rel, () => {
      const raw = fs.readFileSync(file, 'utf8');
      const { data, body } = parseFrontmatter(raw) as {
        data: Record<string, unknown>;
        body: string;
      };

      it('has the required front-matter fields', () => {
        expect(typeof data.title, 'title').toBe('string');
        expect((data.title as string).length).toBeGreaterThan(0);
        expect(typeof data.slug, 'slug').toBe('string');
        expect((data.slug as string).length).toBeGreaterThan(0);
        expect(typeof data.summary, 'summary').toBe('string');
        expect((data.summary as string).length).toBeGreaterThan(20);
        expect((data.summary as string).length).toBeLessThanOrEqual(500);
      });

      it('uses a valid difficulty and distribution', () => {
        const difficulty = (data.difficulty ?? data.level) as string;
        expect(DIFFICULTIES as readonly string[]).toContain(difficulty);
        const distribution = (data.distribution ?? 'General Linux') as string;
        expect(DISTRIBUTIONS as readonly string[]).toContain(distribution);
      });

      it('has a unique slug', () => {
        const slug = data.slug as string;
        expect(slugs.has(slug), `duplicate slug "${slug}" (also in ${slugs.get(slug)})`).toBe(
          false,
        );
        slugs.set(slug, rel);
      });

      it('contains all required sections', () => {
        const headings = body
          .split('\n')
          .filter((l) => /^#{1,6}\s/.test(l))
          .map((l) => l.replace(/^#{1,6}\s+/, '').trim().toLowerCase());
        for (const section of REQUIRED_SECTIONS) {
          const found = headings.some((h) => h.includes(section));
          expect(found, `missing a "${section}" section`).toBe(true);
        }
      });

      it('states an explicit passing requirement in the assessment', () => {
        expect(/passing/i.test(body), 'assessment must state a passing requirement').toBe(true);
      });

      it('has substantial body content', () => {
        expect(body.trim().length).toBeGreaterThan(1500);
      });

      it('renders to safe HTML without throwing', () => {
        const html = renderMarkdown(body);
        expect(html.length).toBeGreaterThan(0);
        expect(html).not.toContain('<script');
      });
    });
  }
});
