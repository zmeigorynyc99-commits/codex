/**
 * General unit converter built around a base-unit factor table.
 *
 * Each category defines a base unit and a factor for every member: the value
 * in base units equals `value * factor`. Conversion is therefore
 * `value * fromFactor / toFactor`.
 */

export interface UnitDef {
  id: string;
  label: string;
  factor: number;
}

export interface UnitCategory {
  id: string;
  label: string;
  base: string;
  units: UnitDef[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    label: 'Length',
    base: 'm',
    units: [
      { id: 'mm', label: 'Millimetre (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimetre (cm)', factor: 0.01 },
      { id: 'm', label: 'Metre (m)', factor: 1 },
      { id: 'km', label: 'Kilometre (km)', factor: 1000 },
      { id: 'in', label: 'Inch (in)', factor: 0.0254 },
      { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
      { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
      { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
      { id: 'nmi', label: 'Nautical mile', factor: 1852 },
    ],
  },
  {
    id: 'mass',
    label: 'Weight / Mass',
    base: 'kg',
    units: [
      { id: 'mg', label: 'Milligram (mg)', factor: 0.000001 },
      { id: 'g', label: 'Gram (g)', factor: 0.001 },
      { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
      { id: 't', label: 'Tonne (t)', factor: 1000 },
      { id: 'oz', label: 'Ounce (oz)', factor: 0.028349523125 },
      { id: 'lb', label: 'Pound (lb)', factor: 0.45359237 },
      { id: 'st', label: 'Stone (st)', factor: 6.35029318 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    base: 'l',
    units: [
      { id: 'ml', label: 'Millilitre (ml)', factor: 0.001 },
      { id: 'l', label: 'Litre (l)', factor: 1 },
      { id: 'm3', label: 'Cubic metre (m³)', factor: 1000 },
      { id: 'tsp', label: 'Teaspoon (US)', factor: 0.00492892 },
      { id: 'tbsp', label: 'Tablespoon (US)', factor: 0.0147868 },
      { id: 'cup', label: 'Cup (US)', factor: 0.236588 },
      { id: 'pt', label: 'Pint (US)', factor: 0.473176 },
      { id: 'qt', label: 'Quart (US)', factor: 0.946353 },
      { id: 'gal', label: 'Gallon (US)', factor: 3.785411784 },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    base: 'm2',
    units: [
      { id: 'cm2', label: 'Square centimetre (cm²)', factor: 0.0001 },
      { id: 'm2', label: 'Square metre (m²)', factor: 1 },
      { id: 'ha', label: 'Hectare (ha)', factor: 10000 },
      { id: 'km2', label: 'Square kilometre (km²)', factor: 1000000 },
      { id: 'ft2', label: 'Square foot (ft²)', factor: 0.09290304 },
      { id: 'ac', label: 'Acre', factor: 4046.8564224 },
      { id: 'mi2', label: 'Square mile (mi²)', factor: 2589988.110336 },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    base: 'mps',
    units: [
      { id: 'mps', label: 'Metre/second (m/s)', factor: 1 },
      { id: 'kmh', label: 'Kilometre/hour (km/h)', factor: 0.277777778 },
      { id: 'mph', label: 'Mile/hour (mph)', factor: 0.44704 },
      { id: 'kn', label: 'Knot (kn)', factor: 0.514444444 },
      { id: 'fts', label: 'Foot/second (ft/s)', factor: 0.3048 },
    ],
  },
  {
    id: 'digital',
    label: 'Digital storage',
    base: 'byte',
    units: [
      { id: 'bit', label: 'Bit', factor: 0.125 },
      { id: 'byte', label: 'Byte', factor: 1 },
      { id: 'kb', label: 'Kilobyte (KB)', factor: 1000 },
      { id: 'kib', label: 'Kibibyte (KiB)', factor: 1024 },
      { id: 'mb', label: 'Megabyte (MB)', factor: 1e6 },
      { id: 'mib', label: 'Mebibyte (MiB)', factor: 1048576 },
      { id: 'gb', label: 'Gigabyte (GB)', factor: 1e9 },
      { id: 'gib', label: 'Gibibyte (GiB)', factor: 1073741824 },
      { id: 'tb', label: 'Terabyte (TB)', factor: 1e12 },
    ],
  },
];

export function convertUnit(
  value: number,
  fromFactor: number,
  toFactor: number,
): number {
  if (toFactor === 0) return NaN;
  return (value * fromFactor) / toFactor;
}

export function findCategory(id: string): UnitCategory | undefined {
  return UNIT_CATEGORIES.find((c) => c.id === id);
}
