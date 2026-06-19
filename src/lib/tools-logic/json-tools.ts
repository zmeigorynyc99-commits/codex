/** JSON formatting, minifying and validation. No code execution involved. */

export interface JsonResult {
  ok: boolean;
  output: string;
  error?: string;
  /** 1-based line number of a syntax error, when determinable. */
  errorLine?: number;
}

function parse(input: string): { value: unknown } | { error: string; line?: number } {
  try {
    return { value: JSON.parse(input) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    const match = message.match(/position (\d+)/);
    let line: number | undefined;
    if (match) {
      const pos = Number(match[1]);
      line = input.slice(0, pos).split('\n').length;
    }
    return { error: message, line };
  }
}

export function formatJson(input: string, indent: number | '\t' = 2): JsonResult {
  if (input.trim() === '') {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const parsed = parse(input);
  if ('error' in parsed) {
    return { ok: false, output: '', error: parsed.error, errorLine: parsed.line };
  }
  return { ok: true, output: JSON.stringify(parsed.value, null, indent) };
}

export function minifyJson(input: string): JsonResult {
  if (input.trim() === '') {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const parsed = parse(input);
  if ('error' in parsed) {
    return { ok: false, output: '', error: parsed.error, errorLine: parsed.line };
  }
  return { ok: true, output: JSON.stringify(parsed.value) };
}

export function validateJson(input: string): JsonResult {
  const parsed = parse(input);
  if ('error' in parsed) {
    return { ok: false, output: '', error: parsed.error, errorLine: parsed.line };
  }
  return { ok: true, output: 'Valid JSON' };
}
