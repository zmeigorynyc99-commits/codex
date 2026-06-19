/** Word, character, sentence and reading-time statistics for plain text. */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** Estimated reading time in minutes (200 wpm), rounded up, min 0. */
  readingTimeMinutes: number;
}

export function analyzeText(text: string): TextStats {
  const characters = [...text].length; // code-point aware
  const charactersNoSpaces = [...text.replace(/\s/g, '')].length;

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;

  const sentences = (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length;

  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : 0;

  const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;

  const readingTimeMinutes = words === 0 ? 0 : Math.ceil(words / 200);

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
  };
}
