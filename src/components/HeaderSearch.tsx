'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Compact header search; submits to the all-tools page with a query string. */
export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim().slice(0, 100);
        router.push(q ? `/tools?q=${encodeURIComponent(q)}` : '/tools');
      }}
      className="hidden md:block"
    >
      <label htmlFor="header-search" className="sr-only">
        Search tools
      </label>
      <input
        id="header-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tools…"
        maxLength={100}
        className="input w-48 py-1.5 text-sm lg:w-64"
        autoComplete="off"
      />
    </form>
  );
}
