/** Body Mass Index calculation. Informational only — see the page disclaimer. */

export interface BmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
}

/** Computes BMI from metric inputs: kilograms and centimetres. */
export function bmiMetric(weightKg: number, heightCm: number): BmiResult | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return classify(weightKg / (heightM * heightM));
}

/** Computes BMI from imperial inputs: pounds and total inches. */
export function bmiImperial(weightLb: number, heightIn: number): BmiResult | null {
  if (weightLb <= 0 || heightIn <= 0) return null;
  return classify((703 * weightLb) / (heightIn * heightIn));
}

function classify(bmi: number): BmiResult {
  let category: BmiResult['category'];
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  return { bmi: Math.round(bmi * 10) / 10, category };
}
