import { z } from "zod";
import { getLeaveRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const harassmentScenarioInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  incidentsCount: z.number().min(1).max(200),
  witnessesCount: z.number().min(0).max(50).default(0),
  hasWrittenProof: z.boolean().default(false),
  hasMedicalProof: z.boolean().default(false),
});

export type HarassmentScenarioInput = z.infer<typeof harassmentScenarioInputSchema>;

export type HarassmentScenarioResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    dossierStrengthScore: number;
    recommendedEscalationLevel: string;
    evidenceReadinessPercent: number;
  };
  explanation: CalculatorExplanation;
};

function escalationLevel(score: number): string {
  if (score < 40) return "Documentation interne prioritaire";
  if (score < 70) return "Reclamation formelle employeur + RH";
  return "Inspection / accompagnement juridique recommande";
}

export function simulateHarassmentScenario(
  rawInput: HarassmentScenarioInput,
): HarassmentScenarioResult {
  const input = harassmentScenarioInputSchema.parse(rawInput);
  const rules = getLeaveRulesByDate(input.calculationDate);
  const base =
    Math.min(input.incidentsCount * 4, 40) +
    Math.min(input.witnessesCount * 6, 30) +
    (input.hasWrittenProof ? 20 : 0) +
    (input.hasMedicalProof ? 10 : 0);
  const dossierStrengthScore = Math.min(100, base);
  const evidenceReadinessPercent = roundMAD(dossierStrengthScore);

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      dossierStrengthScore,
      recommendedEscalationLevel: escalationLevel(dossierStrengthScore),
      evidenceReadinessPercent,
    },
    explanation: {
      summary: `Niveau de preparation du dossier estime a ${dossierStrengthScore}/100.`,
      assumptions: [
        "Le score evalue la solidite documentaire, pas l'issue juridique.",
        "Les preuves ecrites et medicales augmentent fortement la robustesse du dossier.",
      ],
      formulas: [
        "Score = incidents ponderes + temoins ponderes + bonus de preuves.",
      ],
      warnings: [
        "Ce score n'est pas une prediction de decision judiciaire.",
        "La chronologie et la coherence des faits restent essentielles.",
      ],
      nextSteps: [
        "Constituer un journal date des incidents.",
        "Formaliser un signalement ecrit et conserver preuve d'envoi.",
      ],
    },
  };
}
