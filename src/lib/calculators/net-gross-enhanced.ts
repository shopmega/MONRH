import { z } from "zod";
import { getCurrentDateISO, type CalculatorExplanation } from "@/lib/calculators/shared";
import { simulateNetGross } from "@/lib/calculators/net-gross";

export const netGrossEnhancedInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  direction: z.enum(["gross_to_net", "net_to_gross"]).default("gross_to_net"),
  amount: z.number().positive(),
  familySituation: z.enum(["single", "married", "married_with_children", "divorced", "widowed"]).default("single"),
  dependentChildren: z.number().min(0).max(10).default(0),
  disabledChildren: z.number().min(0).max(10).default(0),
  elderlyDependents: z.number().min(0).max(5).default(0),
  transportAllowance: z.number().min(0).default(0),
  accommodationAllowance: z.number().min(0).default(0),
  benefitsInNature: z.enum(["none", "housing", "vehicle", "meals", "mixed"]).default("none"),
  benefitsInNatureAmount: z.number().min(0).default(0),
  regionCode: z.enum(["national", "grand_casablanca", "rabat_sale", "oriental", "marrakech_safi", "souss_massa"]).default("national"),
  professionalExpensesOption: z.enum(["standard", "actual"]).default("standard"),
  actualProfessionalExpenses: z.number().min(0).default(0),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(20).step(0.1).default(6),
});

export type NetGrossEnhancedInput = z.infer<typeof netGrossEnhancedInputSchema>;

export type NetGrossEnhancedResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    grossSalary: number;
    netSalary: number;
    cnssEmployee: number;
    cnssEmployer: number;
    familyAllowanceEmployer: number;
    amoEmployee: number;
    amoEmployer: number;
    professionalDeduction: number;
    familyTaxReduction: number;
    taxableIncome: number;
    incomeTax: number;
    cimrEmployee: number;
    employerTotalCost: number;
    effectiveTaxRate: number;
    netToGrossRatio: number;
  };
  explanation: CalculatorExplanation;
};

function normalizeFamilySituation(input: NetGrossEnhancedInput) {
  if (input.familySituation === "married_with_children") return "married";
  return input.familySituation;
}

export function simulateNetGrossEnhanced(rawInput: NetGrossEnhancedInput): NetGrossEnhancedResult {
  const input = netGrossEnhancedInputSchema.parse(rawInput);
  const familyDependentsCount = Math.min(
    input.dependentChildren + input.disabledChildren + input.elderlyDependents,
    6,
  );
  const additionalDeductionsAnnual =
    input.professionalExpensesOption === "actual" ? input.actualProfessionalExpenses : 0;

  const core = simulateNetGross({
    calculationDate: input.calculationDate,
    direction: input.direction,
    amount: input.amount,
    familySituation: normalizeFamilySituation(input),
    familyDependentsCount,
    additionalDeductionsAnnual,
    includeCimr: input.includeCimr,
    cimrRate: input.cimrRate / 100,
  });

  const grossSalary = core.breakdown.gross;
  const netSalary = core.breakdown.net;
  const effectiveTaxRate = grossSalary > 0 ? (core.breakdown.incomeTax / grossSalary) * 100 : 0;
  const netToGrossRatio = grossSalary > 0 ? (netSalary / grossSalary) * 100 : 0;

  return {
    versionId: core.versionId,
    versionCode: core.versionCode,
    breakdown: {
      grossSalary,
      netSalary,
      cnssEmployee: core.breakdown.cnssEmployee,
      cnssEmployer: core.breakdown.cnssEmployer,
      familyAllowanceEmployer: core.breakdown.familyAllowanceEmployer,
      amoEmployee: core.breakdown.amoEmployee,
      amoEmployer: core.breakdown.amoEmployer,
      professionalDeduction: core.breakdown.professionalExpenseDeduction,
      familyTaxReduction: core.breakdown.familyTaxReduction,
      taxableIncome: core.breakdown.taxableIncome,
      incomeTax: core.breakdown.incomeTax,
      cimrEmployee: core.breakdown.cimrEmployee,
      employerTotalCost: core.breakdown.employerTotalCost,
      effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
      netToGrossRatio: Math.round(netToGrossRatio * 100) / 100,
    },
    explanation: {
      ...core.explanation,
      summary: `Calcul ${input.direction === "gross_to_net" ? "brut vers net" : "net vers brut"} aligne sur le moteur legal principal.`,
      assumptions: [
        ...core.explanation.assumptions,
        `Situation familiale: ${input.familySituation}.`,
        `Personnes a charge retenues: ${familyDependentsCount} (cap legal 6).`,
        "Aucun ajustement fiscal regional n'est applique.",
        input.benefitsInNature !== "none"
          ? `Avantages en nature declares (${input.benefitsInNature}): ${input.benefitsInNatureAmount} MAD, non integres au moteur principal.`
          : "Aucun avantage en nature declare.",
      ],
      warnings: [
        ...core.explanation.warnings,
        "Les champs avancees non couverts par le moteur legal principal sont conserves comme contexte, sans ajustement fiscal arbitraire.",
      ],
    },
  };
}
