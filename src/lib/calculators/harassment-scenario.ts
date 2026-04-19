import { z } from "zod";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

/** Harassment type determines legal framework and valid escalation paths */
export const harassmentScenarioInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  harassmentType: z.enum(["moral", "sexual"]).default("moral"),
  perpetratorRelationship: z.enum(["supervisor", "colleague", "client"]).default("supervisor"),
  incidentsCount: z.number().min(1).max(200),
  witnessesCount: z.number().min(0).max(50).default(0),
  hasWrittenProof: z.boolean().default(false),
  hasMedicalProof: z.boolean().default(false),
  hrNotified: z.boolean().default(false),
  companySize: z.enum(["small", "large"]).default("large"), // small = <10 employees
});

export type HarassmentScenarioInput = z.infer<typeof harassmentScenarioInputSchema>;

export type HarassmentScenarioResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    harassmentType: string;
    perpetratorRelationship: string;
    dossierStrengthScore: number;
    evidenceReadinessPercent: number;
    recommendedEscalationLevel: string;
    employerLiabilityRisk: string;
    priorityActions: string[];
  };
  explanation: CalculatorExplanation;
};

function escalationLevel(score: number, type: HarassmentScenarioInput["harassmentType"]): string {
  if (type === "sexual") {
    if (score < 40) return "Signalement RH + dossier de preuves urgent";
    if (score < 65) return "Plainte penale recommandee + inspection du travail";
    return "Plainte penale immediate + assistance juridique";
  }
  // moral
  if (score < 40) return "Documentation interne prioritaire";
  if (score < 70) return "Reclamation formelle employeur + RH";
  return "Inspection du travail / accompagnement juridique recommande";
}

function employerLiabilityRisk(
  perpetrator: HarassmentScenarioInput["perpetratorRelationship"],
  hrNotified: boolean,
  companySize: HarassmentScenarioInput["companySize"],
): string {
  if (perpetrator === "supervisor") {
    return hrNotified
      ? "Responsabilite directe de l'employeur engagée – inaction RH documentee"
      : "Responsabilite engagee lors du signalement formel";
  }
  if (perpetrator === "colleague") {
    return hrNotified
      ? "Obligation de resultat activee – l'employeur doit agir sous peine de faute"
      : "Signalement RH requis pour engager responsabilite employeur";
  }
  // client
  return companySize === "large"
    ? "Obligation de protection du salarie applicable – procedure interne a initier"
    : "Protection plus limitee pour petite entreprise mais obligation existe";
}

export function simulateHarassmentScenario(
  rawInput: HarassmentScenarioInput,
): HarassmentScenarioResult {
  const input = harassmentScenarioInputSchema.parse(rawInput);

  // Score computation — type-weighted
  const sexualBonus = input.harassmentType === "sexual" ? 10 : 0;
  const supervisorBonus = input.perpetratorRelationship === "supervisor" ? 8 : 0;
  const hrBonus = input.hrNotified ? 12 : 0;
  const smallCompanyPenalty = input.companySize === "small" ? -10 : 0;

  const base =
    Math.min(input.incidentsCount * 4, 40) +
    Math.min(input.witnessesCount * 6, 24) +
    (input.hasWrittenProof ? 20 : 0) +
    (input.hasMedicalProof ? 12 : 0) +
    sexualBonus +
    supervisorBonus +
    hrBonus +
    smallCompanyPenalty;

  const dossierStrengthScore = Math.min(100, Math.max(0, base));
  const evidenceReadinessPercent = dossierStrengthScore;

  const priorityActions: string[] = [];
  if (!input.hasWrittenProof) priorityActions.push("Constituer des preuves ecrites (emails, SMS, journal date).");
  if (!input.hrNotified && input.harassmentType === "sexual") priorityActions.push("Signaler formellement au RH ou responsable hierarchique superieur.");
  if (!input.hasMedicalProof && dossierStrengthScore < 50) priorityActions.push("Consulter un medecin et conserver le certificat medical.");
  if (!input.hrNotified) priorityActions.push("Formaliser le signalement par ecrit avec accusé de reception.");
  if (input.harassmentType === "sexual") priorityActions.push("Contacter le Conseil National des Droits de l'Homme (CNDH) si besoin.");

  return {
    versionId: "ma_2026",
    versionCode: "ma_2026",
    breakdown: {
      harassmentType: input.harassmentType === "moral" ? "Harcelement moral" : "Harcelement sexuel",
      perpetratorRelationship:
        input.perpetratorRelationship === "supervisor"
          ? "Superieur hierarchique"
          : input.perpetratorRelationship === "colleague"
            ? "Collegue"
            : "Client / tiers",
      dossierStrengthScore,
      evidenceReadinessPercent,
      recommendedEscalationLevel: escalationLevel(dossierStrengthScore, input.harassmentType),
      employerLiabilityRisk: employerLiabilityRisk(
        input.perpetratorRelationship,
        input.hrNotified,
        input.companySize,
      ),
      priorityActions,
    },
    explanation: {
      summary: `Score dossier: ${dossierStrengthScore}/100 — ${escalationLevel(dossierStrengthScore, input.harassmentType)}.`,
      assumptions: [
        `Type de harcelement: ${input.harassmentType === "moral" ? "moral (Art. 40 CT)" : "sexuel (Art. 40 CT + Code penal Art. 503-1)."}.`,
        `Auteur: ${input.perpetratorRelationship} — determine le regime de responsabilite employeur.`,
        `Taille entreprise: ${input.companySize === "small" ? "< 10 salaries (protections reduites)" : "> 10 salaries (protections completes)"}.`,
        "Le score evalue la solidite documentaire, non l'issue judiciaire.",
      ],
      formulas: [
        "Score = incidents (max 40) + temoins (max 24) + preuves ecrites (20) + medicales (12) + bonus type/auteur/RH.",
        "Penalite si petite entreprise (procedures internes limitees).",
      ],
      warnings: [
        input.harassmentType === "sexual"
          ? "Le harcelement sexuel est un delit penal en plus d'une faute grave au travail — delai de prescription: 3 ans."
          : "Le harcelement moral peut fonder une prise d'acte de rupture du contrat aux torts de l'employeur.",
        input.companySize === "small"
          ? "Entreprise < 10 salaries: absence de representants du personnel limite les voies internes."
          : "",
        "Ce score n'est pas une prediction de decision judiciaire.",
      ].filter(Boolean),
      nextSteps: priorityActions.length > 0
        ? priorityActions
        : [
          "Dossier bien constitue — preparer le signalement inspection du travail.",
          "Conserver toutes les pieces avec datation precise.",
        ],
    },
  };
}
