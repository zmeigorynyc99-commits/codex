'use client';

import { useEffect } from 'react';

/**
 * Attaches copy-to-clipboard behaviour to the `.code-copy` buttons that the
 * server-rendered Markdown produces. Runs purely on the client; the buttons
 * already exist in the sanitised HTML, so this only wires up click handlers.
 */
export function CodeCopyEnhancer() {
  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.code-copy'));
    const cleanups: Array<() => void> = [];

    buttons.forEach((button) => {
      const handler = async () => {
        const block = button.closest('.code-block');
        const code = block?.querySelector('code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent ?? '');
          const original = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = original;
          }, 1500);
        } catch {
          /* clipboard unavailable */
        }
      };
      button.addEventListener('click', handler);
      cleanups.push(() => button.removeEventListener('click', handler));
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
