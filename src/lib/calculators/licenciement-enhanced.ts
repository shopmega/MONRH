import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const licenciementEnhancedInputSchema = z.object({
  calculationDate: z.string().date().default("2026-03-31"),
  monthlySalary: z.number().positive(),
  contractType: z.enum(["CDI", "CDD"]).default("CDI"),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  yearsOfService: z.number().min(0).max(50).default(3),
  monthsOfService: z.number().min(0).max(11).default(0),
  unusedLeaveDays: z.number().min(0).max(365).default(6),
  dismissalReason: z.enum(["economic", "personal", "misconduct", "other"]).default("economic"),
  dismissalReasonDetails: z.string().default(""),
  priorWarnings: z.number().min(0).max(10).default(0),
  warningDates: z.string().default(""),
  unionRepresentative: z.boolean().default(false),
  departmentSize: z.number().min(1).max(1000).default(10),
  priorDisciplinaryActions: z.boolean().default(false),
  performanceReviews: z.boolean().default(false),
  hrNotified: z.boolean().default(false),
  hrNotificationDate: z.string().default(""),
  abusive: z.boolean().default(false),
  abusiveDetails: z.string().default(""),
});

export type LicenciementEnhancedInput = z.infer<typeof licenciementEnhancedInputSchema>;

export type LicenciementEnhancedResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    legalIndemnity: number;
    noticeIndemnity: number;
    leavePayout: number;
    abusiveDamages: number;
    totalEstimated: number;
    legalRiskLevel: number;
    recommendedActions: string[];
    proceduralCompliance: number;
  };
  explanation: CalculatorExplanation;
};

// Dismissal reason impact factors
const DISMISSAL_FACTORS: Record<string, { indemnityMultiplier: number; noticeMultiplier: number; abusiveRisk: number }> = {
  economic: { indemnityMultiplier: 1.0, noticeMultiplier: 1.0, abusiveRisk: 0.2 },
  personal: { indemnityMultiplier: 1.0, noticeMultiplier: 1.0, abusiveRisk: 0.1 },
  misconduct: { indemnityMultiplier: 0.5, noticeMultiplier: 0.5, abusiveRisk: 0.0 },
  other: { indemnityMultiplier: 1.0, noticeMultiplier: 1.0, abusiveRisk: 0.3 }
};

// Procedural compliance scoring
function calculateProceduralCompliance(input: LicenciementEnhancedInput): number {
  let score = 100; // Start with perfect score
  
  // Check for prior warnings (required for most dismissals)
  if (input.dismissalReason !== 'misconduct' && input.priorWarnings === 0) {
    score -= 30; // Major procedural violation
  }
  
  // Check HR notification (required for all dismissals)
  if (!input.hrNotified) {
    score -= 40; // Major procedural violation
  }
  
  // Check union representative (important for large departments)
  if (input.unionRepresentative && input.departmentSize > 50) {
    score -= 10; // Should have consulted union
  }
  
  // Check prior disciplinary actions
  if (!input.priorDisciplinaryActions && input.dismissalReason !== 'misconduct') {
    score -= 20; // Missing disciplinary process
  }
  
  // Check performance reviews
  if (!input.performanceReviews && input.dismissalReason !== 'misconduct') {
    score -= 15; // Missing performance documentation
  }
  
  return Math.max(0, score);
}

// Calculate abusive dismissal damages
function calculateAbusiveDamages(
  input: LicenciementEnhancedInput,
  legalIndemnity: number,
  rules: any
): { amount: number; explanation: string; riskLevel: number } {
  if (!input.abusive || input.dismissalReason === 'misconduct') {
    return { 
      amount: 0, 
      explanation: "Pas de dommages abusifs (licenciement pour faute ou non abusif)",
      riskLevel: 0 
    };
  }
  
  // Base calculation: 1 month per year of service
  const baseDamages = (input.yearsOfService + input.monthsOfService / 12) * input.monthlySalary;
  
  // Apply caps and multipliers
  const maxDamages = rules.abusiveCapMonths * input.monthlySalary;
  const adjustedDamages = Math.min(baseDamages, maxDamages);
  
  // Additional factors
  let multiplier = 1.0;
  if (input.unionRepresentative) multiplier += 0.2; // Union representation increases damages
  if (input.priorDisciplinaryActions) multiplier -= 0.1; // Prior actions reduce damages
  
  const finalAmount = adjustedDamages * multiplier;
  
  return {
    amount: roundMAD(finalAmount),
    explanation: `Dommages abusifs: ${finalAmount.toFixed(2)} MAD (${input.yearsOfService} mois de salaire)`,
    riskLevel: Math.min(10, Math.round((finalAmount / input.monthlySalary) * 2))
  };
}

// Calculate notice period indemnity
function calculateNoticeIndemnity(
  input: LicenciementEnhancedInput,
  rules: any
): { months: number; amount: number; explanation: string } {
  if (input.contractType === "CDD") {
    // CDD notice is typically in days, not months
    const noticeDays = rules.cddNoticeDaysByCategory[input.workerCategory];
    const noticeAmount = (noticeDays / 30) * input.monthlySalary; // Convert to monthly equivalent
    return {
      months: noticeDays / 30,
      amount: roundMAD(noticeAmount),
      explanation: `Préavis CDD: ${noticeDays} jours (${noticeAmount.toFixed(2)} MAD)`
    };
  }
  
  // CDI notice period
  const noticeMonths = rules.cdiNoticeMonthsByCategory[input.workerCategory];
  let applicableMonths = noticeMonths;
  
  // Adjust based on years of service
  if (input.yearsOfService < 1) {
    applicableMonths = noticeMonths.lt1;
  } else if (input.yearsOfService < 5) {
    applicableMonths = noticeMonths.gte1lt5;
  } else {
    applicableMonths = noticeMonths.gte5;
  }
  
  // For economic dismissals, notice may be reduced
  const dismissalFactor = DISMISSAL_FACTORS[input.dismissalReason];
  const adjustedMonths = Math.max(0.5, applicableMonths * dismissalFactor.noticeMultiplier);
  
  const noticeAmount = adjustedMonths * input.monthlySalary;
  
  return {
    months: adjustedMonths,
    amount: roundMAD(noticeAmount),
    explanation: `Préavis CDI: ${adjustedMonths} mois (${noticeAmount.toFixed(2)} MAD)`
  };
}

export function simulateLicenciementEnhanced(
  rawInput: LicenciementEnhancedInput
): LicenciementEnhancedResult {
  const input = licenciementEnhancedInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  
  // Calculate total service years
  const totalServiceYears = input.yearsOfService + input.monthsOfService / 12;
  
  // Check if contract type is eligible for legal indemnity
  const isEligibleForIndemnity = rules.legalIndemnityContractTypes.includes(input.contractType);
  
  // Calculate legal indemnity
  let legalIndemnity = 0;
  if (isEligibleForIndemnity) {
    // Calculate indemnity based on service years
    let indemnityMonths = 0;
    
    if (totalServiceYears <= 1) {
      indemnityMonths = rules.tranche1HoursPerYear / 191; // Convert hours to months
    } else if (totalServiceYears <= 2) {
      indemnityMonths = rules.tranche2HoursPerYear / 191;
    } else if (totalServiceYears <= 3) {
      indemnityMonths = rules.tranche3HoursPerYear / 191;
    } else {
      indemnityMonths = rules.tranche4HoursPerYear / 191;
    }
    
    legalIndemnity = indemnityMonths * input.monthlySalary;
  }
  
  // Calculate notice indemnity
  const noticeResult = calculateNoticeIndemnity(input, rules);
  
  // Calculate leave payout
  const dailyRate = input.monthlySalary / 191; // Standard monthly hours in Morocco
  const leavePayout = input.unusedLeaveDays * dailyRate;
  
  // Calculate abusive damages
  const abusiveResult = calculateAbusiveDamages(input, legalIndemnity, rules);
  
  // Calculate total estimated amount
  const totalEstimated = legalIndemnity + noticeResult.amount + leavePayout + abusiveResult.amount;
  
  // Calculate legal risk level
  const proceduralCompliance = calculateProceduralCompliance(input);
  const dismissalRisk = DISMISSAL_FACTORS[input.dismissalReason].abusiveRisk;
  const legalRiskLevel = Math.round(
    (proceduralCompliance * 0.3) + 
    (dismissalRisk * 10) + 
    (abusiveResult.riskLevel * 0.6)
  );
  
  // Generate recommended actions
  const recommendedActions: string[] = [];
  
  if (proceduralCompliance < 70) {
    recommendedActions.push("Consulter un avocat pour vice de procédure");
    recommendedActions.push("Documenter les violations procédurales");
  }
  
  if (legalRiskLevel > 7) {
    recommendedActions.push("Préparer une action en justice");
    recommendedActions.push("Conserver toutes les preuves de licenciement");
  }
  
  if (input.abusive && legalRiskLevel > 5) {
    recommendedActions.push("Saisir l'inspection du travail");
    recommendedActions.push("Demander une réintégration ou des dommages");
  }
  
  if (input.unionRepresentative && legalRiskLevel > 3) {
    recommendedActions.push("Contacter le syndicat pour assistance");
  }
  
  if (recommendedActions.length === 0) {
    recommendedActions.push("Procéder à la négociation amiable");
    recommendedActions.push("Vérifier tous les montants dus");
  }
  
  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      legalIndemnity: roundMAD(legalIndemnity),
      noticeIndemnity: roundMAD(noticeResult.amount),
      leavePayout: roundMAD(leavePayout),
      abusiveDamages: roundMAD(abusiveResult.amount),
      totalEstimated: roundMAD(totalEstimated),
      legalRiskLevel: Math.min(10, legalRiskLevel),
      recommendedActions,
      proceduralCompliance: proceduralCompliance
    },
    explanation: {
      summary: `Calcul des indemnités de licenciement avec analyse juridique complète.`,
      assumptions: [
        `Type de contrat: ${input.contractType}`,
        `Catégorie professionnelle: ${input.workerCategory}`,
        `Ancienneté totale: ${totalServiceYears.toFixed(1)} ans`,
        `Motif de licenciement: ${input.dismissalReason}`,
        `Avertissements préalables: ${input.priorWarnings}`,
        `Représentant syndical: ${input.unionRepresentative ? 'Oui' : 'Non'}`,
        `Notification RH: ${input.hrNotified ? 'Oui' : 'Non'}`,
        `Licenciement abusif: ${input.abusive ? 'Oui' : 'Non'}`,
        `Taille département: ${input.departmentSize} employés`
      ],
      formulas: [
        "Indemnité légale = Ancienneté × Salaire mensuel",
        "Préavis = Période légale × Salaire mensuel",
        "Congés restants = Jours × Taux journalier",
        "Dommages abusifs = Ancienneté × Salaire (max 36 mois)",
        "Conformité procédurale basée sur avertissements et notification"
      ],
      warnings: [
        "Les montants peuvent varier selon la convention collective applicable",
        "La procédure de licenciement doit être strictement respectée",
        "Les dommages abusifs sont plafonnées à 36 mois de salaire",
        "Consultez un avocat pour évaluer vos droits spécifiques"
      ],
      nextSteps: [
        "Vérifier la convention collective applicable à votre entreprise",
        "Conserver tous les documents de licenciement",
        "Calculer le solde de tout compte",
        "Préparer une lettre de réclamation si nécessaire",
        "Consulter un avocat si risque élevé ou procédure non respectée"
      ]
    }
  };
}
