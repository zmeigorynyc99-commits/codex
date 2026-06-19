import { describe, it, expect } from 'vitest';
import {
  encodeUrl,
  decodeUrl,
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
} from '@/lib/tools-logic/codecs';
import { formatJson, minifyJson, validateJson } from '@/lib/tools-logic/json-tools';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '@/lib/tools-logic/color';

describe('url codecs', () => {
  it('encodes and decodes round-trip', () => {
    const text = 'hello world & more=value';
    expect(decodeUrl(encodeUrl(text))).toBe(text);
  });
  it('encodes special characters', () => {
    expect(encodeUrl('a b')).toBe('a%20b');
  });
});

describe('base64 codecs', () => {
  it('encodes ASCII', () => {
    expect(encodeBase64('Hello, world!')).toBe('SGVsbG8sIHdvcmxkIQ==');
  });
  it('round-trips Unicode', () => {
    const text = 'Héllo 😇 wörld';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });
  it('supports the URL-safe variant', () => {
    const text = '<<???>>';
    const encoded = encodeBase64Url(text);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(decodeBase64Url(encoded)).toBe(text);
  });
});

describe('json tools', () => {
  it('formats valid JSON', () => {
    const result = formatJson('{"a":1}', 2);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('{\n  "a": 1\n}');
  });
  it('minifies valid JSON', () => {
    expect(minifyJson('{ "a": 1 }').output).toBe('{"a":1}');
  });
  it('reports invalid JSON with a message', () => {
    const result = validateJson('{ bad }');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('color conversions', () => {
  it('parses hex to rgb', () => {
    expect(hexToRgb('#2563EB')).toEqual({ r: 37, g: 99, b: 235 });
  });
  it('expands shorthand hex', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });
  it('rejects invalid hex', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
  });
  it('round-trips rgb -> hex -> rgb', () => {
    const rgb = { r: 12, g: 200, b: 99 };
    expect(hexToRgb(rgbToHex(rgb))).toEqual(rgb);
  });
  it('converts rgb to hsl and back approximately', () => {
    const rgb = { r: 37, g: 99, b: 235 };
    const hsl = rgbToHsl(rgb);
    expect(hsl.h).toBeGreaterThan(210);
    expect(hsl.h).toBeLessThan(225);
    const back = hslToRgb(hsl);
    expect(back.r).toBeCloseTo(rgb.r, -1);
    expect(back.b).toBeCloseTo(rgb.b, -1);
  });
});
