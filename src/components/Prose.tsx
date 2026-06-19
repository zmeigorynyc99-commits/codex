import type { ReactNode } from 'react';

/** Readable measure and spacing for long-form content pages. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose-custom mx-auto max-w-2xl space-y-4 text-slate-700 dark:text-slate-300 [&_a]:text-brand-700 [&_a]:underline dark:[&_a]:text-brand-300 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed">
      {children}
    </div>
  );
}
