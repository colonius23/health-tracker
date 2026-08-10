// Fallback reference ranges (mmol/L, common adult ranges) used only when a
// specific lab result doesn't include its own ref_low/ref_high.
export const DEFAULT_RANGES = {
  'Total Cholesterol': { low: 0, high: 5.2, unit: 'mmol/L' },
  'LDL': { low: 0, high: 3.4, unit: 'mmol/L' },
  'HDL': { low: 1.0, high: 999, unit: 'mmol/L' },
  'Triglycerides': { low: 0, high: 1.7, unit: 'mmol/L' },
  'VLDL': { low: 0, high: 0.9, unit: 'mmol/L' },
  'ApoB': { low: 0, high: 0.9, unit: 'g/L' },
  'Glucose (fasting)': { low: 3.9, high: 5.5, unit: 'mmol/L' },
  'HbA1c': { low: 0, high: 5.6, unit: '%' },
  'Urea': { low: 2.5, high: 7.8, unit: 'mmol/L' },
  'Creatinine': { low: 60, high: 110, unit: 'µmol/L' },
  'Uric Acid': { low: 0.14, high: 0.42, unit: 'mmol/L' },
  'Vitamin D': { low: 50, high: 150, unit: 'nmol/L' },
  'Vitamin B12': { low: 145, high: 569, unit: 'pmol/L' },
}
