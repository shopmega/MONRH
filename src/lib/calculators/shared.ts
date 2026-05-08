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

export function getCurrentDateISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function serviceYearsFromHireDate(hireDateISO: string, calculationDateISO: string): number {
  const hireDate = parseDateOnly(hireDateISO);
  const calculationDate = parseDateOnly(calculationDateISO);
  if (hireDate > calculationDate) {
    throw new Error("hireDate cannot be after calculationDate");
  }

  let totalMonths =
    (calculationDate.getFullYear() - hireDate.getFullYear()) * 12 +
    (calculationDate.getMonth() - hireDate.getMonth());
  if (calculationDate.getDate() < hireDate.getDate()) {
    totalMonths -= 1;
  }
  totalMonths = Math.max(0, totalMonths);

  return Math.floor(totalMonths / 12) + (totalMonths % 12) / 12;
}

export function serviceYearsFromPeriod(input: {
  hireDate?: string;
  calculationDate: string;
  yearsOfService?: number;
  monthsOfService?: number;
}) {
  if (input.hireDate) {
    return serviceYearsFromHireDate(input.hireDate, input.calculationDate);
  }

  return (input.yearsOfService ?? 0) + (input.monthsOfService ?? 0) / 12;
}

export function tenureToNoticeMonths(totalYears: number): number {
  if (totalYears < 1) return 1;
  if (totalYears < 5) return 2;
  return 3;
}
