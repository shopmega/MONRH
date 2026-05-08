import { z } from "zod";
import {
  computeMonthlyPayrollFromGross,
  payrollCoreInputSchema,
  roundMAD,
} from "@/lib/calculators/payroll-core";

export const salaryIncreaseInputSchema = payrollCoreInputSchema.extend({
  currentGross: z.number().positive(),
  newGross: z.number().positive(),
});

export type SalaryIncreaseInput = z.input<typeof salaryIncreaseInputSchema>;

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

export function simulateSalaryIncrease(raw: SalaryIncreaseInput): SalaryIncreaseResult {
  const input = salaryIncreaseInputSchema.parse(raw);
  const current = computeMonthlyPayrollFromGross(input.currentGross, input);
  const proposed = computeMonthlyPayrollFromGross(input.newGross, input);

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
