'use client';

import { useMemo, useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { UNIT_CATEGORIES, convertUnit, findCategory } from '@/lib/tools-logic/units';

export default function UnitConverter() {
  const [categoryId, setCategoryId] = useState(UNIT_CATEGORIES[0]!.id);
  const category = findCategory(categoryId)!;
  const [fromId, setFromId] = useState(category.units[0]!.id);
  const [toId, setToId] = useState(category.units[1]!.id);
  const [value, setValue] = useState('1');

  const result = useMemo(() => {
    const from = category.units.find((u) => u.id === fromId) ?? category.units[0]!;
    const to = category.units.find((u) => u.id === toId) ?? category.units[1] ?? category.units[0]!;
    const v = Number(value);
    if (!Number.isFinite(v)) return '';
    const out = convertUnit(v, from.factor, to.factor);
    return Number(out.toPrecision(8)).toLocaleString('en-US', { maximumFractionDigits: 8 });
  }, [category, fromId, toId, value]);

  function changeCategory(id: string) {
    const next = findCategory(id)!;
    setCategoryId(id);
    setFromId(next.units[0]!.id);
    setToId(next.units[1]!.id);
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  return (
    <ToolShell>
      <div>
        <label htmlFor="cat" className="label">Category</label>
        <select id="cat" value={categoryId} onChange={(e) => changeCategory(e.target.value)} className="input">
          {UNIT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label htmlFor="from" className="label">From</label>
          <input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.slice(0, 24))} className="input mb-2" />
          <select id="from" value={fromId} onChange={(e) => setFromId(e.target.value)} className="input">
            {category.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={swap} className="btn-secondary mb-1 self-center" aria-label="Swap units" title="Swap">⇅</button>
        <div>
          <label htmlFor="to" className="label">To</label>
          <input type="text" readOnly value={result} className="input mb-2 font-mono" aria-live="polite" />
          <select id="to" value={toId} onChange={(e) => setToId(e.target.value)} className="input">
            {category.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </div>

      <CopyButton value={result} label="Copy result" />
    </ToolShell>
  );
}
