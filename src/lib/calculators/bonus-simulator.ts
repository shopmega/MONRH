import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

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

function calcMonthlyNet(gross: number, calculationDate: string) {
  const rules = getSalaryRulesByDate(calculationDate);
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployee = contributableBase * rules.cnssEmployeeRate;
  const amoEmployee = gross * rules.amoEmployeeRate;
  const professionalExpenseDeduction = Math.min(
    gross * rules.professionalExpenseRate,
    rules.professionalExpenseCap,
  );
  const taxableIncome = Math.max(0, gross - cnssEmployee - amoEmployee - professionalExpenseDeduction);
  const incomeTax = computeTax(taxableIncome, rules.taxBracketsMonthly);
  const net = gross - cnssEmployee - amoEmployee - incomeTax;
  const marginalRate = rules.taxBracketsMonthly.findLast((b) => taxableIncome > b.min)?.rate ?? 0;
  return { net: roundMAD(net), incomeTax: roundMAD(incomeTax), marginalRate };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const bonusSimulatorInputSchema = z.object({
  monthlySalaryGross: z.number().positive(),
  bonusGross: z.number().positive(),
  calculationDate: z.string().date().default(getCurrentDateISO),
});

export type BonusSimulatorInput = z.infer<typeof bonusSimulatorInputSchema>;

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

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateBonus(raw: BonusSimulatorInput): BonusSimulatorResult {
  const input = bonusSimulatorInputSchema.parse(raw);
  const normalMonth = calcMonthlyNet(input.monthlySalaryGross, input.calculationDate);
  const bonusMonth = calcMonthlyNet(
    input.monthlySalaryGross + input.bonusGross,
    input.calculationDate,
  );

  const rules = getSalaryRulesByDate(input.calculationDate);
  const normalBase = Math.min(input.monthlySalaryGross, rules.cnssCeiling);
  const normalCnss = normalBase * rules.cnssEmployeeRate;
  const normalAmo = input.monthlySalaryGross * rules.amoEmployeeRate;
  const normalProf = Math.min(input.monthlySalaryGross * rules.professionalExpenseRate, rules.professionalExpenseCap);
  const normalTaxable = Math.max(0, input.monthlySalaryGross - normalCnss - normalAmo - normalProf);

  const combinedGross = input.monthlySalaryGross + input.bonusGross;
  const bonusBase = Math.min(combinedGross, rules.cnssCeiling);
  const bonusCnss = bonusBase * rules.cnssEmployeeRate;
  const bonusAmo = combinedGross * rules.amoEmployeeRate;
  const bonusProf = Math.min(combinedGross * rules.professionalExpenseRate, rules.professionalExpenseCap);
  const bonusTaxable = Math.max(0, combinedGross - bonusCnss - bonusAmo - bonusProf);

  // Net bonus = what the employee actually takes home extra this month
  const bonusNet = roundMAD(bonusMonth.net - normalMonth.net);
  const bonusEffectiveRate = roundMAD(((input.bonusGross - bonusNet) / input.bonusGross) * 100);
  const taxSpike = roundMAD(bonusMonth.incomeTax - normalMonth.incomeTax);

  return {
    calculationDate: input.calculationDate,
    monthlySalaryGross: roundMAD(input.monthlySalaryGross),
    bonusGross: roundMAD(input.bonusGross),
    normalMonth: {
      taxableIncome: roundMAD(normalTaxable),
      net: normalMonth.net,
      incomeTax: normalMonth.incomeTax,
      marginalRate: normalMonth.marginalRate,
    },
    bonusMonth: {
      combinedGross: roundMAD(combinedGross),
      taxableIncome: roundMAD(bonusTaxable),
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
        "Demandez le detachement de la prime sur un mois separé si l'employeur accepte.",
      ],
    },
  };
}
