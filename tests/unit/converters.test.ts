import { describe, it, expect } from 'vitest';
import { convertTemperature, isPhysicallyValid } from '@/lib/tools-logic/temperature';
import { convertUnit, UNIT_CATEGORIES, findCategory } from '@/lib/tools-logic/units';

describe('temperature', () => {
  it('converts Celsius to Fahrenheit and Kelvin', () => {
    expect(convertTemperature(100, 'c', 'f')).toBeCloseTo(212);
    expect(convertTemperature(100, 'c', 'k')).toBeCloseTo(373.15);
    expect(convertTemperature(0, 'c', 'f')).toBeCloseTo(32);
  });

  it('converts Fahrenheit to Celsius', () => {
    expect(convertTemperature(32, 'f', 'c')).toBeCloseTo(0);
    expect(convertTemperature(212, 'f', 'c')).toBeCloseTo(100);
  });

  it('round-trips through Kelvin', () => {
    expect(convertTemperature(convertTemperature(37, 'c', 'k'), 'k', 'c')).toBeCloseTo(37);
  });

  it('flags values below absolute zero', () => {
    expect(isPhysicallyValid(-300, 'c')).toBe(false);
    expect(isPhysicallyValid(-273.15, 'c')).toBe(true);
    expect(isPhysicallyValid(0, 'k')).toBe(true);
    expect(isPhysicallyValid(-1, 'k')).toBe(false);
  });
});

describe('unit converter', () => {
  it('converts kilometres to miles', () => {
    const km = findCategory('length')!.units.find((u) => u.id === 'km')!;
    const mi = findCategory('length')!.units.find((u) => u.id === 'mi')!;
    expect(convertUnit(10, km.factor, mi.factor)).toBeCloseTo(6.21371, 4);
  });

  it('converts kilograms to pounds', () => {
    const kg = findCategory('mass')!.units.find((u) => u.id === 'kg')!;
    const lb = findCategory('mass')!.units.find((u) => u.id === 'lb')!;
    expect(convertUnit(5, kg.factor, lb.factor)).toBeCloseTo(11.0231, 3);
  });

  it('every category has a valid base unit with factor 1', () => {
    for (const category of UNIT_CATEGORIES) {
      const base = category.units.find((u) => u.id === category.base);
      expect(base, `base for ${category.id}`).toBeTruthy();
      expect(base!.factor).toBe(1);
    }
  });
});
