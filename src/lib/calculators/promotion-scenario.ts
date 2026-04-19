import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

function computeTax(taxableIncome: number, brackets: Array<{ min: number; max: number | null; rate: number }>): number {
  let tax = 0;
  for (const b of brackets) {
    const end = b.max ?? Infinity;
    const slice = Math.max(Math.min(taxableIncome, end) - b.min, 0);
    tax += slice * b.rate;
  }
  return Math.max(0, tax);
}

function calcNet(gross: number, calculationDate: string) {
  const rules = getSalaryRulesByDate(calculationDate);
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployee = contributableBase * rules.cnssEmployeeRate;
  const cnssEmployer = contributableBase * rules.cnssEmployerRate;
  const amoEmployee = gross * rules.amoEmployeeRate;
  const amoEmployer = gross * rules.amoEmployerRate;
  const professionalExpenseDeduction = Math.min(
    gross * rules.professionalExpenseRate,
    rules.professionalExpenseCap,
  );
  const taxableIncome = Math.max(0, gross - cnssEmployee - amoEmployee - professionalExpenseDeduction);
  const incomeTax = computeTax(taxableIncome, rules.taxBracketsMonthly);
  const net = gross - cnssEmployee - amoEmployee - incomeTax;
  const employerTotalCost = gross + cnssEmployer + amoEmployer;
  return { net: roundMAD(net), incomeTax: roundMAD(incomeTax), employerTotalCost: roundMAD(employerTotalCost) };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const promotionScenarioInputSchema = z.object({
  currentGross: z.number().positive(),
  proposedGross: z.number().positive(),
  newTitle: z.string().max(100).default(""),
  calculationDate: z.string().date().default(getCurrentDateISO),
});

export type PromotionScenarioInput = z.infer<typeof promotionScenarioInputSchema>;

export type PromotionScenarioResult = {
  calculationDate: string;
  currentGross: number;
  proposedGross: number;
  newTitle: string;
  rawRaisePercent: number;
  current: { net: number; incomeTax: number; employerTotalCost: number };
  proposed: { net: number; incomeTax: number; employerTotalCost: number };
  netGainMonthly: number;
  netGainAnnual: number;
  realRaisePercent: number;
  taxGrowthPercent: number;
  employerCostDelta: number;
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulatePromotionScenario(raw: PromotionScenarioInput): PromotionScenarioResult {
  const input = promotionScenarioInputSchema.parse(raw);
  const current = calcNet(input.currentGross, input.calculationDate);
  const proposed = calcNet(input.proposedGross, input.calculationDate);

  const rawRaisePercent = roundMAD(((input.proposedGross - input.currentGross) / input.currentGross) * 100);
  const netGainMonthly = roundMAD(proposed.net - current.net);
  const netGainAnnual = roundMAD(netGainMonthly * 12);
  const realRaisePercent = roundMAD((netGainMonthly / current.net) * 100);
  const taxGrowthPercent = current.incomeTax > 0
    ? roundMAD(((proposed.incomeTax - current.incomeTax) / current.incomeTax) * 100)
    : 0;
  const employerCostDelta = roundMAD(proposed.employerTotalCost - current.employerTotalCost);

  return {
    calculationDate: input.calculationDate,
    currentGross: roundMAD(input.currentGross),
    proposedGross: roundMAD(input.proposedGross),
    newTitle: input.newTitle,
    rawRaisePercent,
    current: { net: current.net, incomeTax: current.incomeTax, employerTotalCost: current.employerTotalCost },
    proposed: { net: proposed.net, incomeTax: proposed.incomeTax, employerTotalCost: proposed.employerTotalCost },
    netGainMonthly,
    netGainAnnual,
    realRaisePercent,
    taxGrowthPercent,
    employerCostDelta,
    explanation: {
      summary: `La promotion offre +${rawRaisePercent}% de brut, mais seulement +${realRaisePercent}% de net reel (${netGainMonthly} MAD/mois).`,
      warnings: [
        taxGrowthPercent > rawRaisePercent
          ? `Votre IR augmente de ${taxGrowthPercent}% — plus vite que votre salaire brut (+${rawRaisePercent}%).`
          : "",
        `L'employeur supporte ${employerCostDelta} MAD/mois de charges supplementaires pour cette promotion.`,
      ].filter(Boolean) as string[],
      nextSteps: [
        "Utilisez ces chiffres pour negocier: montrez a l'employeur le cout total vs votre gain reel.",
        `Un gain net de ${netGainAnnual} MAD/an represente votre gain concret apres impots.`,
        "Si la promotion s'accompagne d'un changement de responsabilites, valorisez les avantages non monetaires.",
      ],
    },
  };
}
