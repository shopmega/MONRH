import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const sickLeaveInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthlySalary: z.number().positive(),
  sickDays: z.number().min(1).max(730),
  /** Number of paid CNSS days in the last 54 days to check eligibility */
  cnssEligibilityDays: z.number().min(0).max(200).default(54),
  /** Whether the employer pays a top-up to bring indemnity to 100% of salary */
  employerTopUp: z.boolean().default(false),
  /** Employer top-up rate as a fraction of the gap (e.g. 1.0 = full top-up) */
  employerTopUpRate: z.number().min(0).max(1).default(1),
});

export type SickLeaveInput = z.infer<typeof sickLeaveInputSchema>;

export type SickLeaveResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    cnssEligible: boolean;
    waitingDays: number;
    paidDaysByCnss: number;
    cnssCompensation: number;
    employerTopUpAmount: number;
    totalCompensation: number;
    grossIncomeEquivalent: number;
    estimatedIncomeLoss: number;
    longTermIllnessFlag: boolean;
  };
  explanation: CalculatorExplanation;
};

export function simulateSickLeave(rawInput: SickLeaveInput): SickLeaveResult {
  const input = sickLeaveInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);

  const cnssEligible = input.cnssEligibilityDays >= rules.sickLeaveMinCnssEligibilityDays;
  const dailySalary = input.monthlySalary / 26;
  const grossIncomeEquivalent = roundMAD(dailySalary * input.sickDays);

  const effectiveDays = Math.min(input.sickDays, rules.sickLeaveMaxCompensatedDays);
  const waitingDays = cnssEligible ? rules.sickLeaveWaitingDays : 0;
  const paidDaysByCnss = cnssEligible ? Math.max(0, effectiveDays - waitingDays) : 0;

  const cnssCompensation = roundMAD(dailySalary * paidDaysByCnss * rules.sickLeaveCnssCoverageRate);

  // Employer top-up covers the gap between full salary and CNSS indemnity during paid period
  const fullPayForCovered = roundMAD(dailySalary * paidDaysByCnss);
  const cnssGap = Math.max(0, fullPayForCovered - cnssCompensation);
  const employerTopUpAmount = input.employerTopUp
    ? roundMAD(cnssGap * input.employerTopUpRate)
    : 0;

  const totalCompensation = roundMAD(cnssCompensation + employerTopUpAmount);
  const estimatedIncomeLoss = roundMAD(grossIncomeEquivalent - totalCompensation);
  const longTermIllnessFlag = input.sickDays > 180;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      cnssEligible,
      waitingDays,
      paidDaysByCnss: roundMAD(paidDaysByCnss),
      cnssCompensation,
      employerTopUpAmount,
      totalCompensation,
      grossIncomeEquivalent,
      estimatedIncomeLoss,
      longTermIllnessFlag,
    },
    explanation: {
      summary: cnssEligible
        ? `Compensation totale estimee: ${totalCompensation} MAD pour ${input.sickDays} jour(s) d'arret.`
        : `Droits CNSS non ouverts: ${input.cnssEligibilityDays} jours cotises sur les ${rules.sickLeaveMinCnssEligibilityDays} requis dans les 6 derniers mois.`,
      assumptions: [
        `Eligibilite CNSS: ${input.cnssEligibilityDays} jours cotises (seuil: ${rules.sickLeaveMinCnssEligibilityDays} jours sur 6 mois).`,
        `Delai de carence: ${rules.sickLeaveWaitingDays} jours non indemnises.`,
        `Taux CNSS applique: ${roundMAD(rules.sickLeaveCnssCoverageRate * 100)}% du salaire journalier.`,
        input.employerTopUp
          ? `Complement employeur: ${roundMAD(input.employerTopUpRate * 100)}% de l'ecart entre salaire plein et CNSS.`
          : "Aucun complement employeur inclus.",
        longTermIllnessFlag
          ? "Arret > 180 jours: regime ALD (affection de longue duree) potentiellement applicable."
          : "",
      ].filter(Boolean),
      formulas: [
        "Jours indemnises CNSS = jours d'arret - carence (si eligible).",
        "CNSS = salaire journalier x jours indemnises x taux couverture.",
        "Complement = ecart salaire–CNSS sur jours couverts x taux complement.",
        "Perte nette = salaire brut equivalent - compensation totale.",
      ],
      warnings: [
        !cnssEligible
          ? `Insuffisance de cotisation: ${input.cnssEligibilityDays}/${rules.sickLeaveMinCnssEligibilityDays} jours — aucune compensation CNSS due.`
          : `CNSS plafonne a ${rules.sickLeaveMaxCompensatedDays} jours par periode legale.`,
        longTermIllnessFlag
          ? "Au-dela de 180 jours, contacter la CNSS pour procedure ALD et renouvellement de prise en charge."
          : "Transmettre l'arret maladie dans les 48h au medecin-conseil CNSS.",
        "Le versement effectif depend de la validation administrative de la CNSS.",
      ],
      nextSteps: [
        "Verifier votre releve CNSS pour confirmer le nombre de jours cotises.",
        "Consulter la convention collective ou le contrat pour les clauses de complement employeur.",
        "Conserver les preuves de depot du dossier medical.",
      ],
    },
  };
}
