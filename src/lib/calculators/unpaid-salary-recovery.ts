import { z } from "zod";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

const PRESCRIPTION_YEARS = 2;

export const unpaidSalaryRecoveryInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  firstUnpaidDate: z.string().date().optional(),
  lastUnpaidDate: z.string().date().optional(),
  unpaidMonths: z.number().min(1).max(36).optional(),
  partialPaymentPerMonth: z.number().min(0).default(0),
  monthsSinceFirstDefault: z.number().min(1).max(120).optional(),
  penaltyRateAnnual: z.number().min(0).max(50).optional(),
  contractualPenaltyRateAnnual: z.number().min(0).max(50).default(0),
  hasPayslips: z.boolean().default(false),
  hasBankStatements: z.boolean().default(false),
}).superRefine((input, ctx) => {
  const hasDates = Boolean(input.firstUnpaidDate && input.lastUnpaidDate);
  const hasManualDuration = input.unpaidMonths !== undefined && input.monthsSinceFirstDefault !== undefined;
  if (!hasDates && !hasManualDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide firstUnpaidDate/lastUnpaidDate or legacy unpaidMonths/monthsSinceFirstDefault.",
      path: ["firstUnpaidDate"],
    });
  }
});

export type UnpaidSalaryRecoveryInput = z.input<typeof unpaidSalaryRecoveryInputSchema>;

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
  const unpaidMonths = resolveUnpaidMonths(input);
  const monthsSinceFirstDefault = resolveMonthsSinceFirstDefault(input);
  const penaltyRateAnnual = input.contractualPenaltyRateAnnual || input.penaltyRateAnnual || 0;
  const penaltyRatePerMonth = penaltyRateAnnual / 100 / 12;

  const prescriptionLimitMonths = PRESCRIPTION_YEARS * 12;
  const prescribedMonths = Math.max(0, monthsSinceFirstDefault - prescriptionLimitMonths);
  const claimableMonths = Math.max(0, unpaidMonths - prescribedMonths);

  const actualMonthlyShortfall =
    input.partialPaymentPerMonth > 0
      ? Math.max(0, input.monthlySalary - input.partialPaymentPerMonth)
      : input.monthlySalary;

  const principalAmount = roundMAD(actualMonthlyShortfall * claimableMonths);
  const delayPenalties = roundMAD(
    principalAmount * penaltyRatePerMonth * monthsSinceFirstDefault,
  );
  const totalClaimAmount = roundMAD(principalAmount + delayPenalties);

  const prescriptionDeadlineMonths = Math.max(0, prescriptionLimitMonths - monthsSinceFirstDefault);
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
          ? "Claim entierement prescrit (delai de 2 ans depasse). Aucun montant recuperable sans interruption de prescription."
          : `Montant reclamable estime: ${totalClaimAmount} MAD (${claimableMonths} mois sur ${unpaidMonths}).`,
      assumptions: [
        `Salaire mensuel du: ${input.monthlySalary} MAD${input.partialPaymentPerMonth > 0 ? ` - paiement partiel de ${input.partialPaymentPerMonth} MAD, manque mensuel: ${roundMAD(actualMonthlyShortfall)} MAD` : ""}.`,
        "Prescription Art. 399 CT: 2 ans a compter de chaque mois impaye.",
        `Delai ecoule depuis le premier defaut: ${monthsSinceFirstDefault} mois.`,
        penaltyRateAnnual > 0
          ? `Taux contractuel/judiciaire de penalites: ${penaltyRateAnnual}%/an (~${roundMAD(penaltyRatePerMonth * 100)}%/mois).`
          : "Aucune penalite ajoutee faute de taux contractuel ou judiciaire explicite.",
      ],
      formulas: [
        "Mois prescrits = max(0, mois ecoules - 24).",
        "Mois reclamables = mois impayes - mois prescrits.",
        "Principal = manque mensuel x mois reclamables.",
        "Penalites = principal x taux mensuel x mois ecoules, uniquement si un taux explicite est fourni.",
      ],
      warnings: [
        prescriptionRisk !== "none"
          ? `ATTENTION: ${prescribedMonths} mois prescrits. Il reste ${prescriptionDeadlineMonths} mois pour agir sur les mois encore reclamables.`
          : `Encore ${prescriptionDeadlineMonths} mois avant prescription du 1er mois impaye - agissez rapidement.`,
        "L'interruption de prescription peut etre obtenue via mise en demeure recommandee ou saisine prud'homale.",
        !input.hasPayslips || !input.hasBankStatements
          ? "Preuves incompletes: bulletins de paie et releves bancaires renforcent le dossier."
          : "Preuves de paie et releves bancaires declares disponibles.",
      ],
      nextSteps: [
        "Envoyer immediatement une mise en demeure recommandee pour interrompre la prescription.",
        "Rassembler les bulletins de paie et preuves de non-paiement (releves bancaires).",
        "Saisir l'inspection du travail ou le tribunal du travail si aucune reponse sous 15 jours.",
      ],
    },
  };
}

function resolveUnpaidMonths(input: z.infer<typeof unpaidSalaryRecoveryInputSchema>): number {
  if (input.firstUnpaidDate && input.lastUnpaidDate) {
    return Math.max(1, Math.min(36, monthsBetweenInclusive(input.firstUnpaidDate, input.lastUnpaidDate)));
  }
  return input.unpaidMonths ?? 1;
}

function resolveMonthsSinceFirstDefault(input: z.infer<typeof unpaidSalaryRecoveryInputSchema>): number {
  if (input.firstUnpaidDate) {
    return Math.max(1, Math.min(120, monthsBetweenInclusive(input.firstUnpaidDate, input.calculationDate)));
  }
  return input.monthsSinceFirstDefault ?? 1;
}

function monthsBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1;
  return Math.max(1, months);
}
