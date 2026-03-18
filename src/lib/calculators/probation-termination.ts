import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const probationTerminationInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  workedDays: z.number().min(1).max(365),
  probationDurationMonths: z.number().min(1).max(12).default(3),
  probationRenewed: z.boolean().default(false),
  initiator: z.enum(["employer", "employee"]).default("employer"),
  noticeDaysGiven: z.number().min(0).max(60).default(0),
});

export type ProbationTerminationInput = z.infer<typeof probationTerminationInputSchema>;

export type ProbationTerminationResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    category: string;
    probationDurationMonths: number;
    probationWasRenewed: boolean;
    requiredNoticeDays: number;
    noticeDaysGiven: number;
    missingNoticeDays: number;
    compensationDue: number;
    probationLegallyValid: boolean;
  };
  explanation: CalculatorExplanation;
};

/**
 * Notice rules per Code du Travail Art. 14 — indexed by category and weeks worked.
 * Ouvriers: 1 day (<8j), 2 days (8–30j), 8 days (>30j)
 * Employés: 8 days (regardless of time in probation)
 * Cadres/Techniciens: 8 days (≤3 months), 15 days (>3 months)
 */
function requiredNoticeDays(
  workedDays: number,
  category: ProbationTerminationInput["workerCategory"],
  probationMonths: number,
): number {
  if (category === "ouvrier") {
    if (workedDays < 8) return 1;
    if (workedDays < 30) return 2;
    return 8;
  }
  if (category === "employe") {
    return 8;
  }
  // cadre
  return probationMonths <= 3 ? 8 : 15;
}

/** Max legal probation duration by category (Art. 13 CT) */
function maxProbationMonths(category: ProbationTerminationInput["workerCategory"]): number {
  if (category === "ouvrier") return 2;   // Art. 13: 1 mois répétable une fois = max 2 mois
  if (category === "employe") return 3;   // Art. 13: 1.5 mois répétable une fois = max 3 mois
  return 6; // cadres/techniciens: 3 mois répétables une fois = max 6 mois
}

export function simulateProbationTermination(
  rawInput: ProbationTerminationInput,
): ProbationTerminationResult {
  const input = probationTerminationInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);

  const maxProbation = maxProbationMonths(input.workerCategory);
  const effectiveDuration = input.probationRenewed ? input.probationDurationMonths * 2 : input.probationDurationMonths;
  const probationLegallyValid = effectiveDuration <= maxProbation;

  const required = requiredNoticeDays(input.workedDays, input.workerCategory, input.probationDurationMonths);
  const missing = Math.max(0, required - input.noticeDaysGiven);
  const dailySalary = input.monthlySalary / 26;

  // Only the employer owes compensation for missing notice; employee owes nothing if they quit during probation
  const compensationDue = input.initiator === "employer" ? roundMAD(missing * dailySalary) : 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      category: input.workerCategory,
      probationDurationMonths: input.probationDurationMonths,
      probationWasRenewed: input.probationRenewed,
      requiredNoticeDays: required,
      noticeDaysGiven: input.noticeDaysGiven,
      missingNoticeDays: missing,
      compensationDue,
      probationLegallyValid,
    },
    explanation: {
      summary: `Preavis requis (${input.workerCategory}): ${required} jours. Compensation estimee: ${compensationDue} MAD.`,
      assumptions: [
        `Categorie: ${input.workerCategory} — grille de preavis Art. 14 Code du Travail.`,
        `Duree d'essai: ${input.probationDurationMonths} mois${input.probationRenewed ? " (renouvelee)" : ""}.`,
        `Duree totale: ${effectiveDuration} mois / maximum legal: ${maxProbation} mois.`,
        input.initiator === "employer"
          ? "Rupture a l'initiative de l'employeur: compensation due si preavis insuffisant."
          : "Rupture a l'initiative du salarie: aucune compensation due.",
      ],
      formulas: [
        "Jours manquants = preavis requis - preavis donne.",
        "Compensation = jours manquants x (salaire mensuel / 26).",
      ],
      warnings: [
        !probationLegallyValid
          ? `Attention: duree totale de ${effectiveDuration} mois depasse le maximum legal (${maxProbation} mois). La periode d'essai peut etre requalifiee en CDI.`
          : "Periode d'essai dans les limites legales.",
        "Le contrat peut prevoir des conditions specifiques de periode d'essai.",
        "En cas de requalification de la periode d'essai, les regles du licenciement s'appliquent.",
      ],
      nextSteps: [
        "Conserver la notification de rupture et les preuves des dates de debut/fin d'essai.",
        "Verifier le contrat de travail avant d'accepter le solde de tout compte.",
        !probationLegallyValid ? "Consulter un avocat si la periode d'essai a ete prolongee au-dela du maximum legal." : "",
      ].filter(Boolean),
    },
  };
}
