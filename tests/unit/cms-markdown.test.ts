import { describe, it, expect } from 'vitest';
import { renderMarkdown, extractToc, readingTime, isDestructive } from '@/lib/cms/markdown';

describe('markdown sanitization', () => {
  it('strips <script> tags', () => {
    const html = renderMarkdown('Hello\n\n<script>alert(1)</script>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });

  it('strips event-handler attributes and javascript: URLs', () => {
    const html = renderMarkdown('[click](javascript:alert(1))\n\n<img src=x onerror="alert(1)">');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
  });

  it('keeps safe formatting: headings, lists, links, tables', () => {
    const html = renderMarkdown(
      '## Title\n\n- one\n- two\n\n[site](https://example.com)\n\n| a | b |\n|---|---|\n| 1 | 2 |',
    );
    expect(html).toContain('<h2');
    expect(html).toContain('<ul>');
    expect(html).toContain('<table>');
    expect(html).toContain('href="https://example.com"');
  });

  it('adds ids to headings for anchors', () => {
    const html = renderMarkdown('## Install the Package');
    expect(html).toContain('id="install-the-package"');
  });

  it('highlights fenced code blocks and adds a copy button', () => {
    const html = renderMarkdown('```bash\necho hello\n```');
    expect(html).toContain('class="hljs');
    expect(html).toContain('code-copy');
    expect(html).toContain('language-bash');
  });

  it('marks external links as noopener noreferrer', () => {
    const html = renderMarkdown('[ext](https://example.com)');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });
});

describe('destructive command detection', () => {
  it('flags dangerous commands', () => {
    expect(isDestructive('sudo rm -rf /')).toBe(true);
    expect(isDestructive('mkfs.ext4 /dev/sda1')).toBe(true);
    expect(isDestructive('dd if=/dev/zero of=/dev/sda')).toBe(true);
    expect(isDestructive('ls -la')).toBe(false);
  });

  it('renders a warning banner for destructive code blocks', () => {
    const html = renderMarkdown('```bash\nrm -rf /\n```');
    expect(html).toContain('code-danger');
  });
});

describe('alert callouts', () => {
  it('renders GitHub-style warning alerts', () => {
    const html = renderMarkdown('> [!WARNING]\n> Be careful here.');
    expect(html).toContain('callout-warning');
    expect(html).toContain('Be careful here.');
  });
});

describe('toc & reading time', () => {
  it('extracts h2/h3 headings', () => {
    const toc = extractToc('# Top\n\n## Section A\n\n### Sub\n\n## Section B');
    expect(toc.map((t) => t.text)).toEqual(['Section A', 'Sub', 'Section B']);
    expect(toc[0]!.id).toBe('section-a');
  });

  it('estimates reading time excluding code', () => {
    const words = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(readingTime(words)).toBe(2);
    expect(readingTime('short')).toBe(1);
  });
});
