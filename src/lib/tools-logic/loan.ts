/** Fixed-rate amortising loan calculations. */

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

/**
 * Computes the monthly payment for a fully amortising loan.
 * @param principal Amount borrowed (must be > 0)
 * @param annualRatePct Nominal annual interest rate as a percentage (e.g. 5.5)
 * @param years Term length in years (must be > 0)
 */
export function calculateLoan(
  principal: number,
  annualRatePct: number,
  years: number,
): LoanResult | null {
  if (principal <= 0 || years <= 0) return null;

  const months = Math.round(years * 12);
  const monthlyRate = annualRatePct / 100 / 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment,
    totalPayment,
    totalInterest: totalPayment - principal,
  };
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/** Builds a month-by-month amortization schedule. */
export function amortizationSchedule(
  principal: number,
  annualRatePct: number,
  years: number,
): AmortizationRow[] {
  const result = calculateLoan(principal, annualRatePct, years);
  if (!result) return [];
  const months = Math.round(years * 12);
  const monthlyRate = annualRatePct / 100 / 12;
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m += 1) {
    const interest = balance * monthlyRate;
    let principalPaid = result.monthlyPayment - interest;
    if (m === months) principalPaid = balance; // absorb rounding on final row
    balance = Math.max(0, balance - principalPaid);
    rows.push({
      month: m,
      payment: result.monthlyPayment,
      principal: principalPaid,
      interest,
      balance,
    });
  }
  return rows;
}
