import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const probationTerminationInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  workedDays: z.number().min(1).max(365),
  initiator: z.enum(["employer", "employee"]).default("employer"),
  noticeDaysGiven: z.number().min(0).max(60).default(0),
});

export type ProbationTerminationInput = z.infer<typeof probationTerminationInputSchema>;

export type ProbationTerminationResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    requiredNoticeDays: number;
    noticeDaysGiven: number;
    missingNoticeDays: number;
    compensationDue: number;
  };
  explanation: CalculatorExplanation;
};

function requiredNoticeDays(workedDays: number): number {
  if (workedDays < 8) return 1;
  if (workedDays < 30) return 2;
  return 8;
}

export function simulateProbationTermination(
  rawInput: ProbationTerminationInput,
): ProbationTerminationResult {
  const input = probationTerminationInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const required = requiredNoticeDays(input.workedDays);
  const missing = Math.max(0, required - input.noticeDaysGiven);
  const dailySalary = input.monthlySalary / 26;
  const compensationDue =
    input.initiator === "employer" ? missing * dailySalary : 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      requiredNoticeDays: required,
      noticeDaysGiven: input.noticeDaysGiven,
      missingNoticeDays: missing,
      compensationDue: roundMAD(compensationDue),
    },
    explanation: {
      summary: `Preavis requis: ${required} jours. Compensation estimee: ${roundMAD(compensationDue)} MAD.`,
      assumptions: [
        "Duree de preavis estimee selon jours travailles pendant l'essai.",
        "Compensation appliquee uniquement si rupture par employeur sans preavis suffisant.",
      ],
      formulas: [
        "Jours manquants = preavis requis - preavis donne.",
        "Compensation = jours manquants x salaire journalier.",
      ],
      warnings: [
        "Le contrat peut fixer des dispositions specifiques de periode d'essai.",
      ],
      nextSteps: [
        "Conserver notification de rupture et preuves des dates.",
        "Verifier le contrat avant d'accepter le solde final.",
      ],
    },
  };
}
