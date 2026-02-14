import { z } from "zod";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";

export const smigComplianceInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  salaryType: z.enum(["smig", "smag"]).default("smig"),
  currentSalaryMad: z.number().positive(),
});

export type SmigComplianceInput = z.infer<typeof smigComplianceInputSchema>;

export type SmigComplianceResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    salaryType: "smig" | "smag";
    currentSalaryMad: number;
    minimumRequiredMad: number;
    gapMad: number;
    compliant: boolean;
  };
  explanation: {
    summary: string;
    assumptions: string[];
    formulas: string[];
    warnings: string[];
    nextSteps: string[];
  };
};

function roundMAD(value: number) {
  return Math.round(value * 100) / 100;
}

export function simulateSmigCompliance(
  rawInput: SmigComplianceInput,
): SmigComplianceResult {
  const input = smigComplianceInputSchema.parse(rawInput);
  const rules = getSmigRulesByDate(input.calculationDate);
  const minimumRequiredMad =
    input.salaryType === "smig"
      ? rules.smigHourlyMad * rules.referenceHoursPerMonth
      : rules.smagDailyMad * rules.referenceDaysPerMonth;

  const gapMad = input.currentSalaryMad - minimumRequiredMad;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      salaryType: input.salaryType,
      currentSalaryMad: roundMAD(input.currentSalaryMad),
      minimumRequiredMad: roundMAD(minimumRequiredMad),
      gapMad: roundMAD(gapMad),
      compliant: gapMad >= 0,
    },
    explanation: {
      summary:
        gapMad >= 0
          ? `Salaire conforme avec une marge de ${roundMAD(gapMad)} MAD au-dessus du minimum.`
          : `Salaire non conforme avec un manque de ${roundMAD(Math.abs(gapMad))} MAD.`,
      assumptions: [
        `Reference ${input.salaryType.toUpperCase()} appliquee pour la date selectionnee.`,
        "Le calcul utilise la base horaire/journaliere standard du moteur.",
      ],
      formulas: [
        "Seuil requis = taux legal x base de reference mensuelle.",
        "Ecart = salaire actuel - seuil requis.",
      ],
      warnings: [
        "Les primes variables ne remplacent pas toujours une insuffisance du salaire de base.",
      ],
      nextSteps: [
        "En cas de non-conformite, preparer une reclamation ecrite avec bulletins justificatifs.",
        "Conserver cette simulation avec sa date et sa version legale.",
      ],
    },
  };
}
