import type { ReactNode } from 'react';

/** Consistent card container for a tool's interactive controls. */
export function ToolShell({ children }: { children: ReactNode }) {
  return <div className="card space-y-5">{children}</div>;
}

/** Labelled result line with monospace value styling. */
export function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
