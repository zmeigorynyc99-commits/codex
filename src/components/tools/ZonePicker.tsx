'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ZoneOption } from '@/lib/tools-logic/timezone-data';

interface Props {
  value: string;
  onChange: (zone: string) => void;
  options: ZoneOption[];
  ariaLabel: string;
  className?: string;
}

/**
 * Searchable time-zone combobox. The typed text only filters the list; the
 * selected zone changes only when the user picks a valid option, so an invalid
 * zone string is never handed to Intl (which would otherwise throw).
 */
export function ZonePicker({ value, onChange, options, ariaLabel, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const byZone = useMemo(() => new Map(options.map((o) => [o.zone, o])), [options]);
  const display = byZone.get(value)?.label ?? value;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    return options.filter((o) => o.search.includes(q)).slice(0, 60);
  }, [query, options]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function select(zone: string) {
    onChange(zone);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        value={open ? query : display}
        placeholder="Search country, city or zone…"
        onFocus={() => {
          setOpen(true);
          setQuery('');
          setActive(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const choice = results[active];
            if (choice) select(choice.zone);
          } else if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
          }
        }}
        className="input py-1.5 text-sm"
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          id={listboxId}
          aria-label={ariaLabel}
          className="absolute z-20 mt-1 max-h-72 w-full min-w-[16rem] overflow-auto rounded-lg border border-slate-300 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {results.map((o, i) => (
            <li key={o.zone} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => select(o.zone)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm ${
                  i === active ? 'bg-brand-600 text-white' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="truncate">{o.label}</span>
                <span className={`shrink-0 font-mono text-xs ${i === active ? 'text-white/80' : 'text-slate-400'}`}>
                  {o.zone}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
