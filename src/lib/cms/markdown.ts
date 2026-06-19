import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import sanitizeHtml from 'sanitize-html';
import { slugify } from './slug';

// Register only the languages we support, keeping the bundle small.
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import ini from 'highlight.js/lib/languages/ini';
import properties from 'highlight.js/lib/languages/properties';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
import diff from 'highlight.js/lib/languages/diff';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('sh', shell);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('nginx', nginx);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('docker', dockerfile);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('conf', ini);
hljs.registerLanguage('properties', properties);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('text', plaintext);

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  nginx: 'Nginx',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  python: 'Python',
  py: 'Python',
  javascript: 'JavaScript',
  js: 'JavaScript',
  ini: 'INI',
  conf: 'Config',
  properties: 'Properties',
  sql: 'SQL',
  diff: 'Diff',
  text: 'Text',
};

const ALERT_TYPES: Record<string, { label: string; cls: string }> = {
  NOTE: { label: 'Note', cls: 'note' },
  TIP: { label: 'Tip', cls: 'tip' },
  IMPORTANT: { label: 'Important', cls: 'important' },
  WARNING: { label: 'Warning', cls: 'warning' },
  CAUTION: { label: 'Caution', cls: 'danger' },
  DANGER: { label: 'Danger', cls: 'danger' },
};

/** Patterns for commands that can destroy data or a system. */
const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i,
  /\brm\s+-rf\s+\//i,
  /\bmkfs(\.\w+)?\b/i,
  /\bdd\s+if=.*\bof=\/dev\//i,
  /\b(>|>>)\s*\/dev\/sd[a-z]/i,
  /\bchmod\s+-R\s+777\s+\//,
  /\bchown\s+-R\s+.*\s+\//,
  /:\(\)\s*\{\s*:\|:&\s*\}\s*;:/, // fork bomb
  /\bgit\s+reset\s+--hard\b/i,
  /\bdocker\s+system\s+prune\s+-a\b/i,
  /\bwipefs\b/i,
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isDestructive(code: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((re) => re.test(code));
}

function buildMarked(): Marked {
  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      code(token) {
        const code = token.text ?? '';
        const lang = (token.lang || '').trim().toLowerCase().split(/\s+/)[0] || '';
        let highlighted: string;
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(code, { language: lang }).value;
        } else {
          highlighted = escapeHtml(code);
        }
        const label = LANGUAGE_LABELS[lang] || (lang ? lang.toUpperCase() : 'Code');
        const danger = isDestructive(code)
          ? '<div class="code-danger" role="note">⚠️ This command can permanently change or delete data. Read it carefully and make sure you understand it before running it.</div>'
          : '';
        return (
          `<div class="code-block" data-lang="${escapeHtml(label)}">` +
          danger +
          `<div class="code-toolbar"><span class="code-lang">${escapeHtml(label)}</span>` +
          `<button type="button" class="code-copy" aria-label="Copy code">Copy</button></div>` +
          `<pre><code class="hljs language-${escapeHtml(lang || 'text')}">${highlighted}</code></pre>` +
          `</div>`
        );
      },
      heading(token) {
        const text = this.parser.parseInline(token.tokens);
        const plain = token.text;
        const id = slugify(plain);
        const level = token.depth;
        return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${level}>`;
      },
      blockquote(token) {
        const inner = this.parser.parse(token.tokens);
        const match = inner.match(/^\s*<p>\s*\[!(\w+)\]\s*(<br\s*\/?>)?\s*/i);
        if (match) {
          const type = match[1]!.toUpperCase();
          const alert = ALERT_TYPES[type];
          if (alert) {
            const body = inner.replace(match[0], '<p>');
            return (
              `<div class="callout callout-${alert.cls}" role="note">` +
              `<p class="callout-title">${alert.label}</p>${body}</div>`
            );
          }
        }
        return `<blockquote>${inner}</blockquote>`;
      },
    },
  });

  return marked;
}

const markedInstance = buildMarked();

/** sanitize-html configuration: a strict allowlist for tutorial content. */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
    'strong', 'em', 'del', 'code', 'pre', 'span', 'div', 'button',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    span: ['class'],
    code: ['class'],
    div: ['class', 'data-lang', 'role'],
    button: ['type', 'class', 'aria-label'],
    p: ['class'],
    th: ['align'], td: ['align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || '';
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          ...(isExternal ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {}),
        },
      };
    },
    img: (tagName, attribs) => ({
      tagName: 'img',
      attribs: { ...attribs, loading: 'lazy' },
    }),
  },
};

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Extracts a table of contents (h2/h3) with stable, de-duplicated anchor ids. */
export function extractToc(md: string): TocItem[] {
  const tokens = markedInstance.lexer(md);
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  for (const token of tokens) {
    if (token.type === 'heading' && (token.depth === 2 || token.depth === 3)) {
      const base = slugify(token.text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count}`;
      items.push({ id: base, text: token.text, level: token.depth });
    }
  }
  return items;
}

/** Estimates reading time in minutes from markdown (code blocks excluded). */
export function readingTime(md: string): number {
  const prose = md.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Renders tutorial Markdown to sanitised HTML. No user-supplied HTML or
 * scripts survive: marked produces HTML, highlight.js colours known languages,
 * and sanitize-html strips everything outside a strict allowlist.
 */
export function renderMarkdown(md: string): string {
  const rawHtml = markedInstance.parse(md, { async: false }) as string;
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

export { isDestructive };
