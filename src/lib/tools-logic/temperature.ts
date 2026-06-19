/** Temperature conversion between Celsius, Fahrenheit and Kelvin. */

export type TemperatureUnit = 'c' | 'f' | 'k';

/** Absolute zero in each unit, used to reject physically impossible inputs. */
const ABSOLUTE_ZERO: Record<TemperatureUnit, number> = {
  c: -273.15,
  f: -459.67,
  k: 0,
};

function toCelsius(value: number, from: TemperatureUnit): number {
  switch (from) {
    case 'c':
      return value;
    case 'f':
      return (value - 32) * (5 / 9);
    case 'k':
      return value - 273.15;
  }
}

function fromCelsius(celsius: number, to: TemperatureUnit): number {
  switch (to) {
    case 'c':
      return celsius;
    case 'f':
      return celsius * (9 / 5) + 32;
    case 'k':
      return celsius + 273.15;
  }
}

export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit,
): number {
  return fromCelsius(toCelsius(value, from), to);
}

/** True when the value is at or above absolute zero for its unit. */
export function isPhysicallyValid(value: number, unit: TemperatureUnit): boolean {
  return value >= ABSOLUTE_ZERO[unit] - 1e-9;
}
