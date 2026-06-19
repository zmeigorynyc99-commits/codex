/** Line-based deduplication and tidying utilities. */

export interface DedupeOptions {
  caseSensitive: boolean;
  trimLines: boolean;
  removeEmpty: boolean;
  sort: 'none' | 'asc' | 'desc';
  keep: 'first' | 'last';
}

export interface DedupeResult {
  output: string;
  inputCount: number;
  outputCount: number;
  removed: number;
}

export function removeDuplicateLines(text: string, options: DedupeOptions): DedupeResult {
  const rawLines = text.split(/\r\n|\r|\n/);
  let lines = options.trimLines ? rawLines.map((l) => l.trim()) : rawLines;
  if (options.removeEmpty) {
    lines = lines.filter((l) => l.length > 0);
  }
  const inputCount = lines.length;

  const seen = new Map<string, number>();
  const result: string[] = [];
  lines.forEach((line) => {
    const key = options.caseSensitive ? line : line.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, result.length);
      result.push(line);
    } else if (options.keep === 'last') {
      const idx = seen.get(key)!;
      result[idx] = line;
    }
  });

  if (options.sort === 'asc') {
    result.sort((a, b) => a.localeCompare(b));
  } else if (options.sort === 'desc') {
    result.sort((a, b) => b.localeCompare(a));
  }

  return {
    output: result.join('\n'),
    inputCount,
    outputCount: result.length,
    removed: inputCount - result.length,
  };
}
