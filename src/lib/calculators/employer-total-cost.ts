import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";
import { calculatePayroll, AT_MP_RATES, type PayrollEngineInput } from "@/lib/finance/engine";

export const employerTotalCostInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  grossSalary: z.number().positive(),
  /** Company headcount — determines formation professionnelle rate (1% or 1.6%) */
  companySize: z.enum(["small", "large"]).default("large"),
  /** Sector risk level — drives AT/MP insurance rate */
  sectorRisk: z.enum(["low", "medium", "high", "very_high"]).default("medium"),
  /** Optional additional benefits per month (transport, meals, mutual, etc.) */
  additionalBenefitsMad: z.number().min(0).default(0),
  /** Number of months simulated — to project annual cost */
  months: z.number().min(1).max(14).default(12),
  /** Include 13th month bonus in annual cost */
  include13thMonth: z.boolean().default(false),
});

export type EmployerTotalCostInput = z.input<typeof employerTotalCostInputSchema>;

export type EmployerTotalCostResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    grossSalary: number;
    cnssEmployer: number;
    familyAllowanceEmployer: number;
    amoEmployer: number;
    atMpInsurance: number;
    formationPro: number;
    additionalBenefits: number;
    monthlyTotalCost: number;
    annualTotalCost: number;
    annualCostWithBonus: number;
    effectiveBurdenRatePercent: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateEmployerTotalCost(rawInput: EmployerTotalCostInput): EmployerTotalCostResult {
  const input = employerTotalCostInputSchema.parse(rawInput);
  const engineResult = calculatePayroll(input.grossSalary, input as unknown as PayrollEngineInput);
  const rules = getSalaryRulesByDate(input.calculationDate);

  const atMpRate = AT_MP_RATES[input.sectorRisk];
  const atMpInsurance = engineResult.atMpEmployer;
  const additionalBenefits = roundMAD(input.additionalBenefitsMad);

  const monthlyTotalCost = roundMAD(engineResult.employerTotalCost + additionalBenefits);

  const annualTotalCost = roundMAD(monthlyTotalCost * input.months);
  const bonusMonth = input.include13thMonth
    ? roundMAD(engineResult.employerTotalCost - engineResult.gross + engineResult.gross) // Simply gross + all charges
    : 0;
  const annualCostWithBonus = roundMAD(annualTotalCost + bonusMonth);

  const effectiveBurdenRatePercent = roundMAD(
    ((monthlyTotalCost - input.grossSalary) / input.grossSalary) * 100,
  );

  return {
    versionId: engineResult.versionId,
    versionCode: engineResult.versionCode,
    breakdown: {
      grossSalary: engineResult.gross,
      cnssEmployer: engineResult.cnssEmployer,
      familyAllowanceEmployer: engineResult.familyAllowanceEmployer,
      amoEmployer: engineResult.amoEmployer,
      atMpInsurance,
      formationPro: engineResult.formationProEmployer,
      additionalBenefits,
      monthlyTotalCost,
      annualTotalCost,
      annualCostWithBonus,
      effectiveBurdenRatePercent,
    },
    explanation: {
      summary: `Cout mensuel employeur: ${monthlyTotalCost} MAD. Annuel: ${annualCostWithBonus} MAD.`,
      assumptions: [
        `CNSS employeur: base plafonnee a ${rules.cnssCeiling} MAD (taux ${roundMAD(rules.cnssEmployerRate * 100)}%).`,
        `Allocations familiales: taux ${roundMAD(rules.familyAllowanceEmployerRate * 100)}% sur brut total, a la charge de l'employeur.`,
        `AMO employeur: taux ${roundMAD(rules.amoEmployerRate * 100)}% sur brut total.`,
        `AT/MP (secteur ${input.sectorRisk}): taux ${roundMAD(atMpRate * 100)}% — varie selon classification CNSS.`,
        `Formation professionnelle: ${input.companySize === "small" ? "1%" : "1.6%"} (entreprise ${input.companySize === "small" ? "\u2264 20 salaries" : "> 20 salaries"}).`,
        input.additionalBenefitsMad > 0 ? `Avantages complementaires: ${additionalBenefits} MAD/mois.` : "",
        input.include13thMonth ? "13e mois inclus dans le cout annuel." : "",
      ].filter(Boolean),
      formulas: [
        "CNSS employeur = min(brut, plafond CNSS) x taux employeur.",
        "Allocations familiales = brut x taux allocations familiales employeur.",
        "AMO employeur = brut x taux AMO.",
        "AT/MP = brut x taux secteur.",
        "Formation pro = brut x taux formation.",
        "Cout mensuel total = brut + CNSS + allocations familiales + AMO + AT/MP + formation + avantages.",
        "Taux de charges = (charges totales / brut) x 100.",
      ],
      warnings: [
        "Le taux AT/MP exact est notifie annuellement par la CNSS selon votre activite et sinistralite.",
        "La taxe de formation professionnelle peut etre recuperable via les actions de formation.",
        "D'autres charges peuvent s'ajouter: integrer mutuelle groupe, bonus, primes de performance.",
      ],
      nextSteps: [
        "Comparer plusieurs niveaux de brut pour projection budgetaire RH.",
        "Verifier le taux AT/MP exact sur votre avis CNSS annuel.",
        "Conserver la version legale de reference pour audit paie.",
      ],
    },
  };
}
