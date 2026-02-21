import { z } from "zod";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

/** Moroccan salary claims prescribe after 2 years (Art. 399 CT) */
const PRESCRIPTION_YEARS = 2;

export const unpaidSalaryRecoveryInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  unpaidMonths: z.number().min(1).max(36),
  /** Were any partial payments made? If so, enter the shortfall per month */
  partialPaymentPerMonth: z.number().min(0).default(0),
  /** Months elapsed since the first missed payment — for prescription check */
  monthsSinceFirstDefault: z.number().min(1).max(120),
  /** Legal late payment rate (DGI reference rate; default 7%/year = 0.58%/month) */
  penaltyRatePerMonth: z.number().min(0).max(0.05).default(0.0058),
});

export type UnpaidSalaryRecoveryInput = z.infer<typeof unpaidSalaryRecoveryInputSchema>;

export type UnpaidSalaryRecoveryResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    claimableMonths: number;
    prescribedMonths: number;
    principalAmount: number;
    delayPenalties: number;
    totalClaimAmount: number;
    prescriptionRisk: "none" | "partial" | "full";
    prescriptionDeadlineMonths: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateUnpaidSalaryRecovery(
  rawInput: UnpaidSalaryRecoveryInput,
): UnpaidSalaryRecoveryResult {
  const input = unpaidSalaryRecoveryInputSchema.parse(rawInput);
  const rules = getSmigRulesByDate(input.calculationDate);

  const prescriptionLimitMonths = PRESCRIPTION_YEARS * 12;
  // Months that have passed the prescription limit
  const prescribedMonths = Math.max(0, input.monthsSinceFirstDefault - prescriptionLimitMonths);
  // Claimable = total unpaid months minus those prescribed
  const claimableMonths = Math.max(0, input.unpaidMonths - prescribedMonths);

  const actualMonthlyShortfall =
    input.partialPaymentPerMonth > 0
      ? Math.max(0, input.monthlySalary - input.partialPaymentPerMonth)
      : input.monthlySalary;

  const principalAmount = roundMAD(actualMonthlyShortfall * claimableMonths);
  const delayPenalties = roundMAD(
    principalAmount * input.penaltyRatePerMonth * input.monthsSinceFirstDefault,
  );
  const totalClaimAmount = roundMAD(principalAmount + delayPenalties);

  const prescriptionDeadlineMonths = Math.max(0, prescriptionLimitMonths - input.monthsSinceFirstDefault);
  const prescriptionRisk: UnpaidSalaryRecoveryResult["breakdown"]["prescriptionRisk"] =
    prescribedMonths === 0
      ? "none"
      : claimableMonths === 0
        ? "full"
        : "partial";

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      claimableMonths,
      prescribedMonths,
      principalAmount,
      delayPenalties,
      totalClaimAmount,
      prescriptionRisk,
      prescriptionDeadlineMonths,
    },
    explanation: {
      summary:
        prescriptionRisk === "full"
          ? `Claim entierement prescrit (delai de 2 ans depasse). Aucun montant recuperable sans interruption de prescription.`
          : `Montant reclamable estime: ${totalClaimAmount} MAD (${claimableMonths} mois sur ${input.unpaidMonths}).`,
      assumptions: [
        `Salaire mensuel du: ${input.monthlySalary} MAD${input.partialPaymentPerMonth > 0 ? ` — paiement partiel de ${input.partialPaymentPerMonth} MAD, manque mensuel: ${roundMAD(actualMonthlyShortfall)} MAD` : ""}.`,
        `Prescription Art. 399 CT: 2 ans a compter de chaque mois impaye.`,
        `Delai ecoule depuis le premier defaut: ${input.monthsSinceFirstDefault} mois.`,
        `Taux de penalites: ${roundMAD(input.penaltyRatePerMonth * 100)}%/mois (reference DGI: ~7%/an).`,
      ],
      formulas: [
        "Mois prescrit = max(0, mois ecoules - 24).",
        "Mois reclamables = mois impayes - mois prescrits.",
        "Principal = manque mensuel x mois reclamables.",
        "Penalites = principal x taux mensuel x mois ecoules.",
      ],
      warnings: [
        prescriptionRisk !== "none"
          ? `ATTENTION: ${prescribedMonths} mois prescrits. Il reste ${prescriptionDeadlineMonths} mois pour agir sur les mois encore reclamables.`
          : `Encore ${prescriptionDeadlineMonths} mois avant prescription du 1er mois impaye — agissez rapidement.`,
        "L'interruption de prescription peut etre obtenue via mise en demeure recommandee ou saisine prudh'omal.",
        "Le taux de penalite exact depend du dossier et du juge. La reference DGI est indicative.",
      ],
      nextSteps: [
        "Envoyer immediatement une mise en demeure recommandee pour interrompre la prescription.",
        "Rassembler les bulletins de paie et preuves de non-paiement (releves bancaires).",
        "Saisir l'inspection du travail ou le tribunal du travail si aucune reponse sous 15 jours.",
      ],
    },
  };
}
