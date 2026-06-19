'use client';

import { useState } from 'react';

/**
 * Share links using each network's standard share URL — no third-party
 * tracking scripts or pixels are loaded.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: 'Reddit', href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}` },
    { label: 'Hacker News', href: `https://news.ycombinator.com/submitlink?u=${enc(url)}&t=${enc(title)}` },
    { label: 'Email', href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Share:</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn-secondary !px-3 !py-1 text-xs"
        >
          {link.label}
        </a>
      ))}
      <button type="button" onClick={copyLink} className="btn-secondary !px-3 !py-1 text-xs">
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
