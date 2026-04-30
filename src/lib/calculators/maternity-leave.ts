import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const maternityLeaveInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  leaveStartDate: z.string().date().optional(),
  leaveEndDate: z.string().date().optional(),
  expectedDeliveryDate: z.string().date().optional(),
  monthlySalary: z.number().positive(),
  leaveWeeks: z.number().min(1).max(52).default(14),
  /** CNSS paid months in the 10 months preceding confinement (eligibility check) */
  cnssContributedMonths: z.number().min(0).max(10).default(5),
  /** Whether the employer pays a top-up under convention collective or contract */
  employerTopUp: z.boolean().default(false),
  /** Multiple birth (twins/triplets): extends legal leave */
  multipleChildBirth: z.boolean().default(false),
  /** Premature or ill newborn: can extend leave further */
  prematureOrIllNewborn: z.boolean().default(false),
});

export type MaternityLeaveInput = z.input<typeof maternityLeaveInputSchema>;

export type MaternityLeaveResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    cnssEligible: boolean;
    legalLeaveWeeks: number;
    coveredWeeksByCnss: number;
    leaveMonthsEquivalent: number;
    cnssCompensation: number;
    employerTopUpAmount: number;
    totalEstimatedIncome: number;
    incomeDuringLeave: number;
    incomeGapPercent: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateMaternityLeave(rawInput: MaternityLeaveInput): MaternityLeaveResult {
  const input = maternityLeaveInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);
  const leaveWeeks = resolveCalendarWeeks(input.leaveStartDate, input.leaveEndDate, input.leaveWeeks);

  // Eligibility: at least 3 paid months in the 10 months before confinement
  const cnssEligible = input.cnssContributedMonths >= rules.maternityMinCnssMonths;

  // Legal leave extension for multiple birth (+4 weeks) or premature (+6 weeks) — Art. 154 CT
  let legalLeaveWeeks = rules.maternityLegalLeaveWeeks;
  if (input.multipleChildBirth) legalLeaveWeeks += 4;
  if (input.prematureOrIllNewborn) legalLeaveWeeks += 6;

  const coveredWeeksByCnss = cnssEligible ? Math.min(leaveWeeks, legalLeaveWeeks) : 0;
  const leaveMonthsEquivalent = roundMAD(leaveWeeks / 4.33);
  const coveredMonthsByCnss = coveredWeeksByCnss / 4.33;

  const fullEquivalentIncome = roundMAD(input.monthlySalary * leaveMonthsEquivalent);
  const cnssCompensation = cnssEligible
    ? roundMAD(input.monthlySalary * coveredMonthsByCnss * rules.maternityCnssCoverageRate)
    : 0;

  const employerTopUpAmount = input.employerTopUp
    ? roundMAD(fullEquivalentIncome - cnssCompensation)
    : 0;

  const totalEstimatedIncome = roundMAD(cnssCompensation + employerTopUpAmount);
  const incomeDuringLeave = totalEstimatedIncome;
  const incomeGapPercent =
    fullEquivalentIncome > 0
      ? roundMAD(((fullEquivalentIncome - totalEstimatedIncome) / fullEquivalentIncome) * 100)
      : 0;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      cnssEligible,
      legalLeaveWeeks,
      coveredWeeksByCnss,
      leaveMonthsEquivalent,
      cnssCompensation,
      employerTopUpAmount,
      totalEstimatedIncome,
      incomeDuringLeave,
      incomeGapPercent,
    },
    explanation: {
      summary: cnssEligible
        ? `Revenu estime pendant ${leaveWeeks} semaines de conge: ${totalEstimatedIncome} MAD (ecart: ${incomeGapPercent}% du salaire equivalent).`
        : `Droits CNSS non ouverts: ${input.cnssContributedMonths} mois cotises sur ${rules.maternityMinCnssMonths} requis dans les 10 derniers mois.`,
      assumptions: [
        `Eligibilite CNSS: ${input.cnssContributedMonths} mois cotises (seuil: ${rules.maternityMinCnssMonths} mois sur 10).`,
        `Conge legal de base: ${rules.maternityLegalLeaveWeeks} semaines (Art. 154 CT).`,
        input.multipleChildBirth ? "+4 semaines pour naissance multiple." : "",
        input.prematureOrIllNewborn ? "+6 semaines pour premature ou nouveau-ne malade." : "",
        input.expectedDeliveryDate ? `Date prevue d'accouchement: ${input.expectedDeliveryDate}.` : "",
        `Duree totale legale retenue: ${legalLeaveWeeks} semaines.`,
        `Taux CNSS: ${roundMAD(rules.maternityCnssCoverageRate * 100)}% du salaire pendant les semaines couvertes.`,
        input.employerTopUp ? "Complement employeur: couvre l'ecart entre CNSS et salaire integral." : "Aucun complement employeur.",
      ].filter(Boolean),
      formulas: [
        "CNSS = salaire mensuel x (semaines legales / 4.33) x taux couverture.",
        "Complement = (salaire theorique total - CNSS) si complement employeur actif.",
        "Total revenu = CNSS + complement.",
        "Ecart = (salaire theorique - total revenu) / salaire theorique.",
      ],
      warnings: [
        !cnssEligible
          ? `Non eligible: seulement ${input.cnssContributedMonths} mois cotises — contacter la CNSS pour verification.`
          : "",
        leaveWeeks > legalLeaveWeeks
          ? `Les ${leaveWeeks - legalLeaveWeeks} semaines au-dela du maximum legal ne sont pas couvertes par la CNSS.`
          : "",
        "Les conditions d'ouverture des droits CNSS doivent etre verifiees via le releve de carriere.",
        "Le versement CNSS se fait en une seule fois apres conge — prevoir la tresorerie necessaire.",
      ].filter(Boolean),
      nextSteps: [
        "Constituer le dossier CNSS: formulaire de demande, certificat medical de grossesse, releve CNSS.",
        "Informer l'employeur 30 jours avant le depart pour organiser la couverture du poste.",
        input.employerTopUp ? "Verifier les conditions de complement dans la convention collective ou le contrat." : "",
        !cnssEligible ? "Se renseigner sur les conditions exceptionnelles de prise en charge CNSS." : "",
      ].filter(Boolean),
    },
  };
}

function resolveCalendarWeeks(startDate?: string, endDate?: string, fallbackWeeks = 14): number {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return Math.max(1, Math.min(52, Math.ceil(days / 7)));
  }
  return fallbackWeeks;
}
