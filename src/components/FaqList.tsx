import type { FaqItem } from '@/lib/tools';

/** Accessible FAQ using native <details>/<summary> — works without JavaScript. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={index}
          className="group rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <summary className="cursor-pointer list-none font-medium text-slate-900 marker:hidden dark:text-white">
            <span className="flex items-center justify-between gap-2">
              {item.question}
              <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
