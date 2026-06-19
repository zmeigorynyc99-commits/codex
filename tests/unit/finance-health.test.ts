import { describe, it, expect } from 'vitest';
import { calculateLoan, amortizationSchedule } from '@/lib/tools-logic/loan';
import { bmiMetric, bmiImperial } from '@/lib/tools-logic/bmi';

describe('loan', () => {
  it('computes the monthly payment for an amortising loan', () => {
    const result = calculateLoan(20000, 6, 5)!;
    expect(result.monthlyPayment).toBeCloseTo(386.66, 1);
    expect(result.totalPayment).toBeCloseTo(386.66 * 60, 0);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it('handles zero-interest loans', () => {
    const result = calculateLoan(1200, 0, 1)!;
    expect(result.monthlyPayment).toBeCloseTo(100, 5);
    expect(result.totalInterest).toBeCloseTo(0, 5);
  });

  it('returns null for invalid input', () => {
    expect(calculateLoan(0, 5, 5)).toBeNull();
    expect(calculateLoan(1000, 5, 0)).toBeNull();
  });

  it('produces an amortization schedule that pays off the balance', () => {
    const rows = amortizationSchedule(10000, 5, 2);
    expect(rows).toHaveLength(24);
    expect(rows[rows.length - 1]!.balance).toBeCloseTo(0, 2);
  });
});

describe('bmi', () => {
  it('computes metric BMI and category', () => {
    const result = bmiMetric(70, 175)!;
    expect(result.bmi).toBeCloseTo(22.9, 1);
    expect(result.category).toBe('Normal');
  });

  it('computes imperial BMI', () => {
    const result = bmiImperial(154, 69)!;
    expect(result.bmi).toBeCloseTo(22.7, 1);
    expect(result.category).toBe('Normal');
  });

  it('classifies categories correctly', () => {
    expect(bmiMetric(50, 175)!.category).toBe('Underweight');
    expect(bmiMetric(80, 175)!.category).toBe('Overweight');
    expect(bmiMetric(100, 175)!.category).toBe('Obese');
  });

  it('rejects non-positive input', () => {
    expect(bmiMetric(0, 175)).toBeNull();
    expect(bmiImperial(150, 0)).toBeNull();
  });
});
