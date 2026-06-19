import { describe, it, expect } from 'vitest';
import {
  percentOf,
  whatPercent,
  percentChange,
  addPercent,
  subtractPercent,
} from '@/lib/tools-logic/percentage';

describe('percentage', () => {
  it('finds a percent of a value', () => {
    expect(percentOf(20, 80)).toBe(16);
    expect(percentOf(0, 100)).toBe(0);
    expect(percentOf(150, 200)).toBe(300);
  });

  it('finds what percent one number is of another', () => {
    expect(whatPercent(16, 80)).toBe(20);
    expect(whatPercent(1, 4)).toBe(25);
    expect(Number.isNaN(whatPercent(5, 0))).toBe(true);
  });

  it('computes percentage change', () => {
    expect(percentChange(80, 96)).toBe(20);
    expect(percentChange(100, 50)).toBe(-50);
    expect(Number.isNaN(percentChange(0, 10))).toBe(true);
  });

  it('adds and subtracts percentages', () => {
    expect(addPercent(80, 20)).toBe(96);
    expect(subtractPercent(80, 20)).toBe(64);
  });
});
