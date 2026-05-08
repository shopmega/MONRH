import { z } from "zod";
import {
  computeMonthlyPayrollFromGross,
  payrollCoreInputSchema,
  roundMAD,
} from "@/lib/calculators/payroll-core";

export const bonusSimulatorInputSchema = payrollCoreInputSchema.extend({
  monthlySalaryGross: z.number().positive(),
  bonusGross: z.number().positive(),
});

export type BonusSimulatorInput = z.input<typeof bonusSimulatorInputSchema>;

export type BonusSimulatorResult = {
  calculationDate: string;
  monthlySalaryGross: number;
  bonusGross: number;
  normalMonth: {
    taxableIncome: number;
    net: number;
    incomeTax: number;
    marginalRate: number;
  };
  bonusMonth: {
    combinedGross: number;
    taxableIncome: number;
    net: number;
    incomeTax: number;
    marginalRate: number;
  };
  bonusNet: number;
  bonusEffectiveRate: number;
  taxSpike: number;
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

export function simulateBonus(raw: BonusSimulatorInput): BonusSimulatorResult {
  const input = bonusSimulatorInputSchema.parse(raw);
  const normalMonth = computeMonthlyPayrollFromGross(input.monthlySalaryGross, input);
  const combinedGross = input.monthlySalaryGross + input.bonusGross;
  const bonusMonth = computeMonthlyPayrollFromGross(combinedGross, input);

  const bonusNet = roundMAD(bonusMonth.net - normalMonth.net);
  const bonusEffectiveRate = roundMAD(((input.bonusGross - bonusNet) / input.bonusGross) * 100);
  const taxSpike = roundMAD(bonusMonth.incomeTax - normalMonth.incomeTax);

  return {
    calculationDate: input.calculationDate,
    monthlySalaryGross: roundMAD(input.monthlySalaryGross),
    bonusGross: roundMAD(input.bonusGross),
    normalMonth: {
      taxableIncome: normalMonth.taxableIncome,
      net: normalMonth.net,
      incomeTax: normalMonth.incomeTax,
      marginalRate: normalMonth.marginalRate,
    },
    bonusMonth: {
      combinedGross: roundMAD(combinedGross),
      taxableIncome: bonusMonth.taxableIncome,
      net: bonusMonth.net,
      incomeTax: bonusMonth.incomeTax,
      marginalRate: bonusMonth.marginalRate,
    },
    bonusNet,
    bonusEffectiveRate,
    taxSpike,
    explanation: {
      summary: `Sur une prime brute de ${input.bonusGross} MAD, vous recevrez ${bonusNet} MAD net (taux effectif ${bonusEffectiveRate}%).`,
      warnings: [
        `La prime est cumulee avec le salaire du mois: l'IR est calcule sur ${roundMAD(combinedGross)} MAD.`,
        bonusMonth.marginalRate > normalMonth.marginalRate
          ? `La prime vous fait passer dans la tranche a ${bonusMonth.marginalRate * 100}% ce mois-ci (contre ${normalMonth.marginalRate * 100}% habituellement).`
          : "La prime ne change pas votre tranche marginale ce mois-ci.",
        "En cas de prime exceptionnelle tres importante, envisagez une negociation sur plusieurs mois.",
      ],
      nextSteps: [
        "Comparez ce net avec vos attentes et renegociez le brut si necessaire.",
        "Demandez le detachement de la prime sur un mois separe si l'employeur accepte.",
      ],
    },
  };
}
