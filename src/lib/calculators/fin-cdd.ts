import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

/**
 * Contract types exempt from prime de précarité (Art. 32 Code du Travail):
 * seasonal, training, replacement, apprenticeship
 */
const PRECARITE_EXEMPT_TYPES = ["seasonal", "training", "replacement", "apprenticeship"] as const;
const PRECARITE_RATE_STANDARD = 0.06; // 6% per Art. 32 CT (not 5%)

export const finCddInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  contractMonths: z.number().min(1).max(60),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  noticeDays: z.number().min(0).max(90).default(0),
  contractSubtype: z
    .enum(["standard", "seasonal", "training", "replacement", "apprenticeship"])
    .default("standard"),
  /** Number of times this CDD was renewed (requalification risk if > 1) */
  renewalCount: z.number().min(0).max(5).default(0),
  /** Has the employee worked on this CDD for more than 24 months total including renewals? */
  totalMonthsWithRenewals: z.number().min(1).max(72).default(6),
});

export type FinCddInput = z.infer<typeof finCddInputSchema>;

export type FinCddResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    contractSubtype: string;
    contractGrossAmount: number;
    primePrecarite: number;
    primePrecariteRate: number;
    leavePayout: number;
    noticeCompensation: number;
    totalEndOfContractAmount: number;
    requalificationRisk: "none" | "medium" | "high";
    requalificationNote?: string;
  };
  explanation: CalculatorExplanation;
};

export function simulateFinCdd(rawInput: FinCddInput): FinCddResult {
  const input = finCddInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);

  const isExempt = (PRECARITE_EXEMPT_TYPES as ReadonlyArray<string>).includes(input.contractSubtype);
  const contractGrossAmount = roundMAD(input.monthlySalary * input.contractMonths);

  const primePrecarite = isExempt ? 0 : roundMAD(contractGrossAmount * PRECARITE_RATE_STANDARD);
  const primePrecariteRate = isExempt ? 0 : PRECARITE_RATE_STANDARD;

  const leavePayout = roundMAD((input.monthlySalary / 26) * input.unusedLeaveDays);
  const noticeCompensation = roundMAD((input.monthlySalary / 26) * input.noticeDays);
  const totalEndOfContractAmount = roundMAD(primePrecarite + leavePayout + noticeCompensation);

  // Requalification risk assessment (Art. 16 CT: max 12 months + 1 renewal = 24 months)
  let requalificationRisk: FinCddResult["breakdown"]["requalificationRisk"] = "none";
  let requalificationNote: string | undefined;

  if (input.totalMonthsWithRenewals > 24) {
    requalificationRisk = "high";
    requalificationNote = `Duree totale (${input.totalMonthsWithRenewals} mois) depasse 24 mois — requalification en CDI quasi-certaine.`;
  } else if (input.renewalCount > 1) {
    requalificationRisk = "medium";
    requalificationNote = `${input.renewalCount} renouvellements — Art. 16 CT n'autorise qu'un seul renouvellement pour les CDD standards.`;
  } else if (input.totalMonthsWithRenewals > 12 && input.contractSubtype === "standard") {
    requalificationRisk = "medium";
    requalificationNote = `Duree de ${input.totalMonthsWithRenewals} mois avec resenouvellement: verifier la conformite avec la limite legale.`;
  }

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      contractSubtype: input.contractSubtype,
      contractGrossAmount,
      primePrecarite,
      primePrecariteRate,
      leavePayout,
      noticeCompensation,
      totalEndOfContractAmount,
      requalificationRisk,
      ...(requalificationNote ? { requalificationNote } : {}),
    },
    explanation: {
      summary: `Total fin de CDD estime: ${totalEndOfContractAmount} MAD${requalificationRisk !== "none" ? ` — Risque requalification: ${requalificationRisk}.` : "."}`,
      assumptions: [
        `Type de CDD: ${input.contractSubtype}${isExempt ? " — exempte de prime de precarite (Art. 32 CT)." : ` — prime de precarite: ${roundMAD(PRECARITE_RATE_STANDARD * 100)}% (Art. 32 CT).`}`,
        `Duree totale avec renouvellements: ${input.totalMonthsWithRenewals} mois.`,
        "Conges restants valorises sur base journaliere (salaire / 26).",
        input.noticeDays > 0 ? `Preavis de ${input.noticeDays} jours inclus.` : "Aucun preavis inclus.",
      ],
      formulas: [
        `Prime precarite = brut cumulé CDD x ${roundMAD(PRECARITE_RATE_STANDARD * 100)}% (si applicable).`,
        "Conges payes = (salaire / 26) x jours restants.",
        "Total = prime precarite + conges + compensation preavis.",
      ],
      warnings: [
        isExempt
          ? `CDD de type "${input.contractSubtype}" exempte de prime de precarite — verifier la justification contractuelle.`
          : "La prime de precarite s'applique a 6% (Art. 32 CT) — ne pas confondre avec le taux 5% parfois pratique.",
        requalificationRisk !== "none"
          ? requalificationNote ?? ""
          : "En cas de requalification, toutes les regles du CDI s'appliquent retroactivement.",
        "Les clauses contractuelles peuvent affecter l'applicabilite de la prime.",
      ].filter(Boolean),
      nextSteps: [
        "Verifier le solde de tout compte propose par l'employeur.",
        "Conserver les preuves de duree effective du CDD (contrat et avenants).",
        requalificationRisk !== "none"
          ? "Consulter un specialiste pour evaluer une eventuelle action en requalification."
          : "",
      ].filter(Boolean),
    },
  };
}
