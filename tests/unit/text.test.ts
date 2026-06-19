import { describe, it, expect } from 'vitest';
import { analyzeText } from '@/lib/tools-logic/text-stats';
import { convertCase } from '@/lib/tools-logic/text-case';
import { removeDuplicateLines } from '@/lib/tools-logic/dedupe';

describe('analyzeText', () => {
  it('counts words and characters', () => {
    const stats = analyzeText('Hello world');
    expect(stats.words).toBe(2);
    expect(stats.characters).toBe(11);
    expect(stats.charactersNoSpaces).toBe(10);
  });

  it('returns zeros for empty input', () => {
    const stats = analyzeText('');
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.readingTimeMinutes).toBe(0);
  });

  it('counts sentences and paragraphs', () => {
    const stats = analyzeText('One. Two! Three?\n\nA new paragraph here.');
    expect(stats.sentences).toBe(4);
    expect(stats.paragraphs).toBe(2);
  });
});

describe('convertCase', () => {
  it('handles basic cases', () => {
    expect(convertCase('hello world', 'upper')).toBe('HELLO WORLD');
    expect(convertCase('HELLO', 'lower')).toBe('hello');
    expect(convertCase('hello world', 'title')).toBe('Hello World');
  });

  it('handles code cases', () => {
    expect(convertCase('hello world', 'camel')).toBe('helloWorld');
    expect(convertCase('hello world', 'pascal')).toBe('HelloWorld');
    expect(convertCase('hello world', 'snake')).toBe('hello_world');
    expect(convertCase('hello world', 'kebab')).toBe('hello-world');
    expect(convertCase('hello world', 'constant')).toBe('HELLO_WORLD');
  });

  it('splits existing camelCase when re-casing', () => {
    expect(convertCase('helloWorld', 'kebab')).toBe('hello-world');
  });
});

describe('removeDuplicateLines', () => {
  it('removes duplicates keeping first occurrence and order', () => {
    const result = removeDuplicateLines('b\na\nb\nc\na', {
      caseSensitive: true,
      trimLines: true,
      removeEmpty: true,
      sort: 'none',
      keep: 'first',
    });
    expect(result.output).toBe('b\na\nc');
    expect(result.removed).toBe(2);
  });

  it('respects case-insensitivity', () => {
    const result = removeDuplicateLines('Apple\napple', {
      caseSensitive: false,
      trimLines: true,
      removeEmpty: true,
      sort: 'none',
      keep: 'first',
    });
    expect(result.outputCount).toBe(1);
  });

  it('can sort the output', () => {
    const result = removeDuplicateLines('c\na\nb', {
      caseSensitive: true,
      trimLines: true,
      removeEmpty: true,
      sort: 'asc',
      keep: 'first',
    });
    expect(result.output).toBe('a\nb\nc');
  });
});
