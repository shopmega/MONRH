import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

// ─── Shared IR helper (same logic as net-gross) ───────────────────────────────

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

function computeTax(
  taxableIncome: number,
  brackets: Array<{ min: number; max: number | null; rate: number }>,
): number {
  let tax = 0;
  for (const b of brackets) {
    const end = b.max ?? Infinity;
    const slice = Math.max(Math.min(taxableIncome, end) - b.min, 0);
    tax += slice * b.rate;
  }
  return Math.max(0, tax);
}

function calcNet(
  gross: number,
  calculationDate: string,
  includeCimr: boolean,
  cimrRate: number,
): {
  net: number;
  cnssEmployee: number;
  amoEmployee: number;
  cimrEmployee: number;
  incomeTax: number;
  professionalExpenseDeduction: number;
  taxableIncome: number;
  employerTotalCost: number;
} {
  const rules = getSalaryRulesByDate(calculationDate);
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployee = contributableBase * rules.cnssEmployeeRate;
  const cnssEmployer = contributableBase * rules.cnssEmployerRate;
  const amoEmployee = gross * rules.amoEmployeeRate;
  const amoEmployer = gross * rules.amoEmployerRate;
  const cimrEmployee = includeCimr ? gross * cimrRate : 0;
  const professionalExpenseDeduction = Math.min(
    gross * rules.professionalExpenseRate,
    rules.professionalExpenseCap,
  );
  const taxableIncome = Math.max(
    0,
    gross - cnssEmployee - amoEmployee - professionalExpenseDeduction,
  );
  const incomeTax = computeTax(taxableIncome, rules.taxBracketsMonthly);
  const net = gross - cnssEmployee - amoEmployee - cimrEmployee - incomeTax;
  const employerTotalCost = gross + cnssEmployer + amoEmployer;
  return {
    net: roundMAD(net),
    cnssEmployee: roundMAD(cnssEmployee),
    amoEmployee: roundMAD(amoEmployee),
    cimrEmployee: roundMAD(cimrEmployee),
    incomeTax: roundMAD(incomeTax),
    professionalExpenseDeduction: roundMAD(professionalExpenseDeduction),
    taxableIncome: roundMAD(taxableIncome),
    employerTotalCost: roundMAD(employerTotalCost),
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const salaryIncreaseInputSchema = z.object({
  currentGross: z.number().positive(),
  newGross: z.number().positive(),
  calculationDate: z.string().date().default("2026-01-01"),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(0.12).default(0.06),
});

export type SalaryIncreaseInput = z.infer<typeof salaryIncreaseInputSchema>;

export type SalaryIncreaseResult = {
  calculationDate: string;
  currentGross: number;
  newGross: number;
  rawIncreasePercent: number;
  current: {
    net: number;
    cnssEmployee: number;
    amoEmployee: number;
    cimrEmployee: number;
    incomeTax: number;
    employerTotalCost: number;
  };
  proposed: {
    net: number;
    cnssEmployee: number;
    amoEmployee: number;
    cimrEmployee: number;
    incomeTax: number;
    employerTotalCost: number;
  };
  netGain: {
    monthly: number;
    annual: number;
    realIncreasePercent: number;
    employerCostDelta: number;
  };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateSalaryIncrease(raw: SalaryIncreaseInput): SalaryIncreaseResult {
  const input = salaryIncreaseInputSchema.parse(raw);
  const current = calcNet(input.currentGross, input.calculationDate, input.includeCimr, input.cimrRate);
  const proposed = calcNet(input.newGross, input.calculationDate, input.includeCimr, input.cimrRate);

  const rawIncreasePercent = roundMAD(((input.newGross - input.currentGross) / input.currentGross) * 100);
  const netGainMonthly = roundMAD(proposed.net - current.net);
  const realIncreasePercent = roundMAD((netGainMonthly / current.net) * 100);
  const employerCostDelta = roundMAD(proposed.employerTotalCost - current.employerTotalCost);

  return {
    calculationDate: input.calculationDate,
    currentGross: roundMAD(input.currentGross),
    newGross: roundMAD(input.newGross),
    rawIncreasePercent,
    current: {
      net: current.net,
      cnssEmployee: current.cnssEmployee,
      amoEmployee: current.amoEmployee,
      cimrEmployee: current.cimrEmployee,
      incomeTax: current.incomeTax,
      employerTotalCost: current.employerTotalCost,
    },
    proposed: {
      net: proposed.net,
      cnssEmployee: proposed.cnssEmployee,
      amoEmployee: proposed.amoEmployee,
      cimrEmployee: proposed.cimrEmployee,
      incomeTax: proposed.incomeTax,
      employerTotalCost: proposed.employerTotalCost,
    },
    netGain: {
      monthly: netGainMonthly,
      annual: roundMAD(netGainMonthly * 12),
      realIncreasePercent,
      employerCostDelta,
    },
    explanation: {
      summary: `Une augmentation brute de ${rawIncreasePercent}% se traduit par un gain net reel de ${realIncreasePercent}% (${netGainMonthly} MAD/mois).`,
      warnings: [
        "L'IR etant progressif, l'augmentation brute produit toujours un gain net inferieur au gain brut.",
        "Verifiez si l'augmentation modifie votre tranche marginale d'IR.",
        realIncreasePercent < rawIncreasePercent * 0.6
          ? `Attention: votre gain net (${realIncreasePercent}%) est significativement inferieur a l'augmentation brute (${rawIncreasePercent}%) en raison de la progression fiscale.`
          : "Le gain net est proportionnel a l'augmentation brute.",
      ].filter(Boolean) as string[],
      nextSteps: [
        "Utilisez ce rapport pour etayer votre demande d'augmentation.",
        `L'employeur supportera ${employerCostDelta} MAD/mois de cout additionnel.`,
        "Comparez ce gain avec vos objectifs de vie (credit, epargne).",
      ],
    },
  };
}
