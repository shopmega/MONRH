import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const finCddInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  contractMonths: z.number().min(1).max(60),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  precariteApplicable: z.boolean().default(true),
  noticeDays: z.number().min(0).max(90).default(0),
});

export type FinCddInput = z.infer<typeof finCddInputSchema>;

export type FinCddResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    contractGrossAmount: number;
    primePrecarite: number;
    leavePayout: number;
    noticeCompensation: number;
    totalEndOfContractAmount: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateFinCdd(rawInput: FinCddInput): FinCddResult {
  const input = finCddInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const contractGrossAmount = input.monthlySalary * input.contractMonths;
  const primePrecarite = input.precariteApplicable ? contractGrossAmount * 0.05 : 0;
  const leavePayout = (input.monthlySalary / 26) * input.unusedLeaveDays;
  const noticeCompensation = (input.monthlySalary / 26) * input.noticeDays;
  const totalEndOfContractAmount = primePrecarite + leavePayout + noticeCompensation;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      contractGrossAmount: roundMAD(contractGrossAmount),
      primePrecarite: roundMAD(primePrecarite),
      leavePayout: roundMAD(leavePayout),
      noticeCompensation: roundMAD(noticeCompensation),
      totalEndOfContractAmount: roundMAD(totalEndOfContractAmount),
    },
    explanation: {
      summary: `Montant estime de fin de CDD: ${roundMAD(totalEndOfContractAmount)} MAD.`,
      assumptions: [
        "Prime de precarite estimee a 5% du brut contractuel lorsqu'applicable.",
        "Les conges restants sont convertis en salaire journalier.",
        "Une compensation de preavis peut etre ajoutee selon jours saisis.",
      ],
      formulas: [
        "Prime precarite = brut cumule CDD x 5% (si applicable).",
        "Conges payes = salaire journalier x jours restants.",
        "Total fin CDD = prime + conges + compensation preavis.",
      ],
      warnings: [
        "Les clauses contractuelles peuvent affecter l'applicabilite de la prime.",
      ],
      nextSteps: [
        "Verifier le solde de tout compte propose par l'employeur.",
        "Conserver les preuves de duree effective du CDD.",
      ],
    },
  };
}
