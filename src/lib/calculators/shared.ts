export type CalculatorExplanation = {
  summary: string;
  assumptions: string[];
  formulas: string[];
  warnings: string[];
  nextSteps: string[];
  confidence?: {
    level: "low" | "medium" | "high";
    label?: string;
    note: string;
  };
  sources?: string[];
  missingInformation?: string[];
};

export function roundMAD(value: number): number {
  return Math.round(value * 100) / 100;
}

export function tenureToNoticeMonths(totalYears: number): number {
  if (totalYears < 1) return 1;
  if (totalYears < 5) return 2;
  return 3;
}
