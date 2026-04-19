import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import {
  formatDateOnly,
  getCurrentDateISO,
  parseDateOnly,
  type CalculatorExplanation,
  roundMAD,
  serviceYearsFromPeriod,
} from "@/lib/calculators/shared";

export const demissionInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  contractType: z.enum(["CDI", "CDD"]).default("CDI"),
  hireDate: z.string().date().optional(),
  yearsOfService: z.number().min(0).max(60).default(0),
  monthsOfService: z.number().min(0).max(11).default(0),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  noticeServed: z.boolean().default(true),
});

export type DemissionInput = z.infer<typeof demissionInputSchema>;

export type DemissionResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    contractType: string;
    workerCategory: string;
    hireDate?: string;
    totalServiceYears: number;
    requiredNoticeMonths: number;
    recommendedDepartureDate: string;
    leavePayout: number;
    noticeCompensationDue: number;
    netFinancialOutcome: number;
    cddNote?: string;
  };
  explanation: CalculatorExplanation;
};

/**
 * Notice months for resignation — per category and seniority (Code du Travail Art. 43)
 * Same structure as licenciement but applied symmetrically to employee-side notice.
 */
function categoryNoticeMonths(
  totalYears: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
  category: DemissionInput["workerCategory"],
): number {
  const map = rules.cdiNoticeMonthsByCategory[category];
  if (totalYears < 1) return map.lt1;
  if (totalYears < 5) return map.gte1lt5;
  return map.gte5;
}

function addMonths(dateISO: string, months: number): string {
  const date = parseDateOnly(dateISO);
  date.setMonth(date.getMonth() + months);
  return formatDateOnly(date);
}

function addDays(dateISO: string, days: number): string {
  const date = parseDateOnly(dateISO);
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

export function simulateDemission(rawInput: DemissionInput): DemissionResult {
  const input = demissionInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const totalServiceYears = serviceYearsFromPeriod(input);

  const requiredNoticeMonths =
    input.contractType === "CDD"
      ? 0 // CDD notice handled in days (simplified)
      : categoryNoticeMonths(totalServiceYears, rules, input.workerCategory);

  const cddNoticeDays =
    input.contractType === "CDD" ? rules.cddNoticeDaysByCategory[input.workerCategory] : 0;

  const leavePayout = roundMAD((input.monthlySalary / 26) * input.unusedLeaveDays);

  // If notice not served by employee: employer may deduct notice indemnity
  const noticeCompensationDue = input.noticeServed
    ? 0
    : input.contractType === "CDI"
      ? roundMAD(input.monthlySalary * requiredNoticeMonths)
      : roundMAD((input.monthlySalary / 26) * cddNoticeDays);

  const recommendedDepartureDate = input.noticeServed
    ? input.contractType === "CDI"
      ? addMonths(input.calculationDate, requiredNoticeMonths)
      : addDays(input.calculationDate, cddNoticeDays)
    : input.calculationDate;

  const netFinancialOutcome = roundMAD(leavePayout - noticeCompensationDue);

  const cddNote =
    input.contractType === "CDD"
      ? `Preavis CDD pour ${input.workerCategory}: ${cddNoticeDays} jours.`
      : undefined;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      ...(input.hireDate ? { hireDate: input.hireDate } : {}),
      totalServiceYears: roundMAD(totalServiceYears),
      requiredNoticeMonths: input.contractType === "CDI" ? requiredNoticeMonths : 0,
      recommendedDepartureDate,
      leavePayout,
      noticeCompensationDue,
      netFinancialOutcome,
      ...(cddNote ? { cddNote } : {}),
    },
    explanation: {
      summary: `Resultat net de demission estime: ${netFinancialOutcome} MAD.`,
      assumptions: [
        `Categorie: ${input.workerCategory} — preavis selon Art. 43 Code du Travail.`,
        `Type de contrat: ${input.contractType}.`,
        input.contractType === "CDI"
          ? `Anciennete: ${roundMAD(totalServiceYears)} ans → preavis requis: ${requiredNoticeMonths} mois.`
          : `Preavis CDD: ${cddNoticeDays} jours pour ${input.workerCategory}.`,
        input.noticeServed ? "Preavis execute: aucune retenue." : "Preavis non execute: indemnite preavis retenue.",
        "Conges restants valorises en salaire journalier (salaire / 26).",
      ],
      formulas: [
        "Indemnite conges = (salaire / 26) x jours restants.",
        "Compensation preavis (CDI) = salaire mensuel x mois preavis requis (si non execute).",
        "Compensation preavis (CDD) = (salaire / 26) x jours preavis (si non execute).",
        "Resultat net = conges payes - compensation preavis.",
      ],
      warnings: [
        "La demission ne donne pas droit a l'indemnite de licenciement.",
        "Certaines conventions collectives preevoient des preavis differents — verifier.",
        input.contractType === "CDD"
          ? "La rupture anticipee d'un CDD par le salarie peut engager sa responsabilite civile."
          : "",
      ].filter(Boolean),
      nextSteps: [
        "Verifier les jours de conges officiels avant remise de la demission.",
        "Formaliser la demission par lettre recommandee avec accusé.",
        "Obtenir le certificat de travail et le solde de tout compte signe.",
      ],
    },
  };
}
