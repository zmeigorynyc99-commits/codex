'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable function identity that always invokes the latest version of
 * `callback`. Useful for debounced effects that must see current state without
 * re-subscribing on every render.
 */
export function useCallbackRef<Args extends unknown[], R>(
  callback: (...args: Args) => R,
): (...args: Args) => R {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}
