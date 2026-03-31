import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const dureePreavisInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  contractType: z.enum(["CDI", "CDD"]).default("CDI"),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  yearsOfService: z.number().min(0).max(60).default(0),
  monthsOfService: z.number().min(0).max(11).default(0),
});

export type DureePreavisInput = z.infer<typeof dureePreavisInputSchema>;

export type DureePreavisResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    contractType: "CDI" | "CDD";
    workerCategory: "cadre" | "employe" | "ouvrier";
    totalServiceYears: number;
    requiredNoticeMonths: number;
    requiredNoticeDays: number;
  };
  explanation: CalculatorExplanation;
};

function cdiNoticeMonths(
  totalYears: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
  workerCategory: DureePreavisInput["workerCategory"],
): number {
  const category = rules.cdiNoticeMonthsByCategory[workerCategory];
  if (totalYears < 1) return category.lt1;
  if (totalYears < 5) return category.gte1lt5;
  return category.gte5;
}

export function simulateDureePreavis(rawInput: DureePreavisInput): DureePreavisResult {
  const input = dureePreavisInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);

  const totalServiceYears = input.yearsOfService + input.monthsOfService / 12;
  const requiredNoticeMonths =
    input.contractType === "CDI"
      ? cdiNoticeMonths(totalServiceYears, rules, input.workerCategory)
      : 0;
  const requiredNoticeDays =
    input.contractType === "CDD"
      ? rules.cddNoticeDaysByCategory[input.workerCategory]
      : roundMAD(requiredNoticeMonths * 30);

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      totalServiceYears: roundMAD(totalServiceYears),
      requiredNoticeMonths,
      requiredNoticeDays,
    },
    explanation: {
      summary:
        input.contractType === "CDI"
          ? `Preavis estime: ${requiredNoticeMonths} mois (${requiredNoticeDays} jours approx.).`
          : `Preavis estime: ${requiredNoticeDays} jours pour CDD (${input.workerCategory}).`,
      assumptions: [
        `Type de contrat: ${input.contractType}.`,
        `Categorie professionnelle: ${input.workerCategory}.`,
        input.contractType === "CDI"
          ? `Anciennete retenue: ${roundMAD(totalServiceYears)} ans.`
          : "Preavis CDD applique en jours selon categorie.",
      ],
      formulas: [
        "CDI: preavis par tranche d'anciennete et categorie (lt1, 1-5, 5+ ans).",
        "CDD: preavis en jours selon categorie.",
      ],
      warnings: [
        "Certaines conventions collectives peuvent prevoir des preavis differents.",
        "Les jours CDI sont affiches a titre indicatif (conversion 1 mois = 30 jours).",
      ],
      nextSteps: [
        "Verifier la convention collective et les clauses du contrat.",
        "Conserver une preuve ecrite de notification du preavis.",
      ],
    },
  };
}

