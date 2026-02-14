import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import {
  type CalculatorExplanation,
  roundMAD,
  tenureToNoticeMonths,
} from "@/lib/calculators/shared";

export const demissionInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  yearsOfService: z.number().min(0).max(60),
  monthsOfService: z.number().min(0).max(11).default(0),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  noticeServed: z.boolean().default(true),
});

export type DemissionInput = z.infer<typeof demissionInputSchema>;

export type DemissionResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    totalServiceYears: number;
    requiredNoticeMonths: number;
    leavePayout: number;
    noticeCompensationDue: number;
    netFinancialOutcome: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateDemission(rawInput: DemissionInput): DemissionResult {
  const input = demissionInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const totalServiceYears = input.yearsOfService + input.monthsOfService / 12;
  const requiredNoticeMonths = tenureToNoticeMonths(totalServiceYears);
  const leavePayout = (input.monthlySalary / 26) * input.unusedLeaveDays;
  const noticeCompensationDue = input.noticeServed
    ? 0
    : input.monthlySalary * requiredNoticeMonths;
  const netFinancialOutcome = leavePayout - noticeCompensationDue;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      totalServiceYears: roundMAD(totalServiceYears),
      requiredNoticeMonths,
      leavePayout: roundMAD(leavePayout),
      noticeCompensationDue: roundMAD(noticeCompensationDue),
      netFinancialOutcome: roundMAD(netFinancialOutcome),
    },
    explanation: {
      summary: `Resultat financier estime de la demission: ${roundMAD(netFinancialOutcome)} MAD.`,
      assumptions: [
        "Le preavis requis est estime selon l'anciennete.",
        "Les conges non pris sont valorises sur une base journaliere (salaire/26).",
        input.noticeServed
          ? "Preavis considere execute."
          : "Preavis non execute, compensation potentielle deduite.",
      ],
      formulas: [
        "Indemnite conges = salaire journalier x jours restants.",
        "Compensation preavis = salaire mensuel x mois de preavis (si non execute).",
        "Resultat net = conges restants - compensation preavis.",
      ],
      warnings: [
        "Certaines conventions collectives peuvent modifier les regles de preavis.",
      ],
      nextSteps: [
        "Verifier vos jours de conges officiels avant remise de demission.",
        "Formaliser la demission par ecrit avec date de depart claire.",
      ],
    },
  };
}
