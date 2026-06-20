/**
 * Renders untrusted, user-submitted text safely. The text is output through
 * React's normal children path, so it is HTML-escaped automatically — no
 * markup or scripts can be injected. We only preserve whitespace/newlines.
 * We deliberately do NOT auto-linkify or render any HTML.
 */
export function UserText({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`whitespace-pre-wrap break-words ${className}`}>{text}</div>;
}
