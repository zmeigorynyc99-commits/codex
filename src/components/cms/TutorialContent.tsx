import { renderMarkdown } from '@/lib/cms/markdown';
import { CodeCopyEnhancer } from './CodeCopyEnhancer';

/**
 * Renders tutorial Markdown as sanitised HTML. The HTML is produced by the
 * server-side pipeline (marked → highlight.js → sanitize-html), so it is safe
 * to inject; no user-supplied scripts or unsafe markup can survive.
 */
export function TutorialContent({ markdown }: { markdown: string }) {
  const html = renderMarkdown(markdown);
  return (
    <>
      <div className="tutorial-prose" dangerouslySetInnerHTML={{ __html: html }} />
      <CodeCopyEnhancer />
    </>
  );
}
