'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/ui/ToolShell';
import { CopyButton } from '@/components/ui/CopyButton';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCss,
  hslToCss,
  relativeLuminance,
  type Rgb,
} from '@/lib/tools-logic/color';

export default function ColorConverter() {
  const [rgb, setRgb] = useState<Rgb>({ r: 37, g: 99, b: 235 });
  const [hexInput, setHexInput] = useState('#2563EB');

  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const textColor = relativeLuminance(rgb) > 0.4 ? '#000' : '#fff';

  function onHex(value: string) {
    setHexInput(value);
    const parsed = hexToRgb(value);
    if (parsed) setRgb(parsed);
  }

  function onPicker(value: string) {
    setHexInput(value.toUpperCase());
    const parsed = hexToRgb(value);
    if (parsed) setRgb(parsed);
  }

  function setChannel(key: keyof Rgb, value: number) {
    const next = { ...rgb, [key]: Math.max(0, Math.min(255, value || 0)) };
    setRgb(next);
    setHexInput(rgbToHex(next));
  }

  function setHsl(h: number, s: number, l: number) {
    const next = hslToRgb({ h, s, l });
    setRgb(next);
    setHexInput(rgbToHex(next));
  }

  return (
    <ToolShell>
      <div className="flex items-center justify-center rounded-lg p-8 font-mono text-lg font-bold" style={{ backgroundColor: hex, color: textColor }}>
        {hex}
      </div>

      <div className="flex items-center gap-3">
        <input type="color" value={hex} onChange={(e) => onPicker(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-300 dark:border-slate-700" aria-label="Color picker" />
        <div className="flex-1">
          <label htmlFor="hex" className="label">HEX</label>
          <input id="hex" type="text" value={hexInput} onChange={(e) => onHex(e.target.value)} className="input font-mono" maxLength={9} />
        </div>
        <CopyButton value={hex} label="" className="self-end" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label">RGB</span>
          <CopyButton value={rgbToCss(rgb)} label="" className="!px-2 !py-1 text-xs" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['r', 'g', 'b'] as const).map((c) => (
            <div key={c}>
              <label className="sr-only" htmlFor={`rgb-${c}`}>{c.toUpperCase()}</label>
              <input id={`rgb-${c}`} type="number" min={0} max={255} value={rgb[c]} onChange={(e) => setChannel(c, Number(e.target.value))} className="input font-mono" />
            </div>
          ))}
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500">{rgbToCss(rgb)}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label">HSL</span>
          <CopyButton value={hslToCss(hsl)} label="" className="!px-2 !py-1 text-xs" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" min={0} max={360} value={hsl.h} onChange={(e) => setHsl(Number(e.target.value), hsl.s, hsl.l)} className="input font-mono" aria-label="Hue" />
          <input type="number" min={0} max={100} value={hsl.s} onChange={(e) => setHsl(hsl.h, Number(e.target.value), hsl.l)} className="input font-mono" aria-label="Saturation" />
          <input type="number" min={0} max={100} value={hsl.l} onChange={(e) => setHsl(hsl.h, hsl.s, Number(e.target.value))} className="input font-mono" aria-label="Lightness" />
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500">{hslToCss(hsl)}</p>
      </div>
    </ToolShell>
  );
}
