'use client';

import { useState } from 'react';

export function LikeButton({
  tutorialId,
  initialCount,
  initialLiked,
}: {
  tutorialId: number;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/tutorials/${tutorialId}/like`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: '{}',
      });
      if (res.ok) {
        const data = (await res.json()) as { liked: boolean; count: number };
        setLiked(data.liked);
        setCount(data.count);
      }
    } catch {
      /* ignore network errors */
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      className={`btn ${
        liked
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      <span aria-hidden="true">👍</span>
      <span>{liked ? 'Helpful' : 'Was this helpful?'}</span>
      <span className="ml-1 rounded-full bg-black/10 px-2 text-sm dark:bg-white/10">{count}</span>
    </button>
  );
}
