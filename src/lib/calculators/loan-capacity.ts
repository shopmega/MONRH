import { z } from "zod";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

/**
 * French amortization (capital + interest together per payment): 
 * PMT = P * r / (1 - (1 + r)^-n)
 */
function computeMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const loanCapacityInputSchema = z.object({
  netSalary: z.number().positive(),
  otherMonthlyDebts: z.number().min(0).default(0), // existing credit payments
  annualRate: z.number().min(0).max(0.25).default(0.045), // 4.5% default
  termYears: z.number().int().min(1).max(30).default(20),
  // Moroccan banks: max debt ratio 33%
  debtRatioLimit: z.number().min(0.2).max(0.45).default(0.33),
});

export type LoanCapacityInput = z.infer<typeof loanCapacityInputSchema>;

export type LoanCapacityResult = {
  netSalary: number;
  maxMonthlyPayment: number;
  availableAfterDebts: number;
  maxLoanAmount: number;
  termMonths: number;
  annualRate: number;
  scenarios: Array<{
    termYears: number;
    maxLoan: number;
    monthlyPayment: number;
    totalCost: number;
    totalInterest: number;
  }>;
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateLoanCapacity(raw: LoanCapacityInput): LoanCapacityResult {
  const input = loanCapacityInputSchema.parse(raw);
  const termMonths = input.termYears * 12;

  const maxMonthlyPayment = roundMAD(input.netSalary * input.debtRatioLimit);
  const availableAfterDebts = roundMAD(maxMonthlyPayment - input.otherMonthlyDebts);

  // Max loan = how much you can borrow if the payment equals available amount
  const r = input.annualRate / 12;
  let maxLoanAmount = 0;
  if (input.annualRate === 0) {
    maxLoanAmount = availableAfterDebts * termMonths;
  } else {
    maxLoanAmount = (availableAfterDebts * (1 - Math.pow(1 + r, -termMonths))) / r;
  }
  maxLoanAmount = roundMAD(Math.max(0, maxLoanAmount));

  // Generate scenarios for different durations
  const scenarioYears = [10, 15, 20, 25];
  const scenarios = scenarioYears.map((years) => {
    const months = years * 12;
    let loan = 0;
    if (input.annualRate === 0) {
      loan = availableAfterDebts * months;
    } else {
      loan = (availableAfterDebts * (1 - Math.pow(1 + r, -months))) / r;
    }
    loan = roundMAD(Math.max(0, loan));
    const monthlyPayment = roundMAD(computeMonthlyPayment(loan, input.annualRate, months));
    const totalCost = roundMAD(monthlyPayment * months);
    return {
      termYears: years,
      maxLoan: loan,
      monthlyPayment,
      totalCost,
      totalInterest: roundMAD(totalCost - loan),
    };
  });

  const monthlyPayment = roundMAD(computeMonthlyPayment(maxLoanAmount, input.annualRate, termMonths));
  const totalCost = roundMAD(monthlyPayment * termMonths);

  return {
    netSalary: roundMAD(input.netSalary),
    maxMonthlyPayment,
    availableAfterDebts,
    maxLoanAmount,
    termMonths,
    annualRate: input.annualRate,
    scenarios,
    explanation: {
      summary: `Avec un salaire net de ${input.netSalary} MAD et une mensualite maximale de ${availableAfterDebts} MAD, vous pouvez emprunter jusqu'a ${maxLoanAmount} MAD sur ${input.termYears} ans.`,
      warnings: [
        `La limite de taux d'endettement utilisee est ${input.debtRatioLimit * 100}% (regle standard banques marocaines).`,
        input.otherMonthlyDebts > 0
          ? `Vos credits existants (${input.otherMonthlyDebts} MAD/mois) reduisent votre capacite d'emprunt.`
          : "Aucun credit existant declare.",
        "Les banques evaluent egalement votre apport personnel (generalement 10-30% du prix).",
      ],
      nextSteps: [
        "Obtenez une attestation de salaire pour l'ouverture du dossier bancaire.",
        `Calculez votre apport personnel cible (10-30% de ${maxLoanAmount} MAD).`,
        "Consultez plusieurs etablissements pour comparer les taux effectifs globaux (TEG).",
      ],
    },
  };
}
