import { siteConfig } from '@/lib/site';

interface AdSlotProps {
  /** Used for layout sizing; does not load any third-party script by default. */
  format?: 'leaderboard' | 'rectangle' | 'inline';
  className?: string;
}

/**
 * Advertisement placeholder.
 *
 * By default this renders a clearly-labelled, reserved space that does not
 * load any third-party network (so it never harms usability or privacy). To
 * activate real ads, set NEXT_PUBLIC_ENABLE_ADS=true and replace the inner
 * markup with your ad provider's snippet — and update the CSP accordingly.
 * The reserved height prevents layout shift (CLS) either way.
 */
export function AdSlot({ format = 'inline', className = '' }: AdSlotProps) {
  const sizes: Record<NonNullable<AdSlotProps['format']>, string> = {
    leaderboard: 'min-h-[90px]',
    rectangle: 'min-h-[250px]',
    inline: 'min-h-[100px]',
  };

  return (
    <aside
      aria-label="Advertisement"
      className={`flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/60 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 ${sizes[format]} ${className}`}
    >
      {siteConfig.enableAds ? (
        <span>Ad slot ({format})</span>
      ) : (
        <span>Advertisement space</span>
      )}
    </aside>
  );
}
