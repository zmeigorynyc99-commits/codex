'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ToolShell } from '@/components/ui/ToolShell';
import { INPUT_LIMITS, clampText } from '@/lib/tools-logic/limits';

type EccLevel = 'L' | 'M' | 'Q' | 'H';

export default function QrCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('https://tinytools.example');
  const [size, setSize] = useState(256);
  const [ecc, setEcc] = useState<EccLevel>('M');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const value = text.trim();
    if (!value) {
      setDataUrl('');
      setError('');
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(canvas, value, { width: size, errorCorrectionLevel: ecc, margin: 2 }, (err) => {
      if (err) {
        setError('Could not generate a QR code for this input (it may be too long).');
        setDataUrl('');
        return;
      }
      setError('');
      setDataUrl(canvas.toDataURL('image/png'));
    });
  }, [text, size, ecc]);

  return (
    <ToolShell>
      <div>
        <label htmlFor="qr-text" className="label">Text or URL to encode</label>
        <textarea
          id="qr-text"
          value={text}
          onChange={(e) => setText(clampText(e.target.value, INPUT_LIMITS.qrText))}
          rows={3}
          maxLength={INPUT_LIMITS.qrText}
          className="input font-mono text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="size" className="label">Size: {size}px</label>
          <input id="size" type="range" min={128} max={512} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
        <div>
          <label htmlFor="ecc" className="label">Error correction</label>
          <select id="ecc" value={ecc} onChange={(e) => setEcc(e.target.value as EccLevel)} className="input">
            <option value="L">Low (7%)</option>
            <option value="M">Medium (15%)</option>
            <option value="Q">Quartile (25%)</option>
            <option value="H">High (30%)</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-lg bg-white p-3">
          <canvas ref={canvasRef} className="block" aria-label="Generated QR code" />
        </div>
        {dataUrl && (
          <a href={dataUrl} download="qr-code.png" className="btn-primary">
            Download PNG
          </a>
        )}
      </div>
    </ToolShell>
  );
}
