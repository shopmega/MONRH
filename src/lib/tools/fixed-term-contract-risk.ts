import { z } from "zod";

export const fixedTermContractRiskInputSchema = z.object({
  contractReasonDocumented: z.boolean(),
  contractHasEndDate: z.boolean(),
  durationMonths: z.number().min(0).max(60),
  renewalsCount: z.number().int().min(0).max(10).default(0),
  roleIsPermanentNeed: z.boolean(),
  trialPeriodDays: z.number().int().min(0).max(180).default(0),
  salaryAndHoursClear: z.boolean(),
  signedByBothParties: z.boolean(),
});

export type FixedTermContractRiskInput = z.infer<typeof fixedTermContractRiskInputSchema>;

export type FixedTermContractRiskResult = {
  riskScore: number;
  level: "low" | "medium" | "high";
  recommendationCodes: string[];
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export function assessFixedTermContractRisk(
  rawInput: FixedTermContractRiskInput,
): FixedTermContractRiskResult {
  const input = fixedTermContractRiskInputSchema.parse(rawInput);
  const issues: FixedTermContractRiskResult["issues"] = [];

  if (!input.contractReasonDocumented) {
    issues.push({
      code: "REASON_NOT_DOCUMENTED",
      severity: "high",
      message: "Le motif du CDD n'est pas clairement documente.",
    });
  }
  if (!input.contractHasEndDate) {
    issues.push({
      code: "NO_END_DATE",
      severity: "high",
      message: "Le CDD doit preciser une date de fin ou un terme.",
    });
  }
  if (input.durationMonths > 24) {
    issues.push({
      code: "LONG_DURATION",
      severity: "medium",
      message: "La duree du CDD est elevee et doit etre justifiee.",
    });
  }
  if (input.renewalsCount >= 2) {
    issues.push({
      code: "MANY_RENEWALS",
      severity: input.renewalsCount >= 3 ? "high" : "medium",
      message: "Le nombre de renouvellements augmente le risque de requalification.",
    });
  }
  if (input.roleIsPermanentNeed) {
    issues.push({
      code: "PERMANENT_NEED_ROLE",
      severity: "high",
      message: "Le poste semble couvrir un besoin permanent de l'entreprise.",
    });
  }
  if (input.trialPeriodDays > 30) {
    issues.push({
      code: "LONG_TRIAL_PERIOD",
      severity: "low",
      message: "La periode d'essai parait longue pour un CDD.",
    });
  }
  if (!input.salaryAndHoursClear) {
    issues.push({
      code: "TERMS_NOT_CLEAR",
      severity: "medium",
      message: "Le contrat doit preciser clairement salaire et horaires.",
    });
  }
  if (!input.signedByBothParties) {
    issues.push({
      code: "MISSING_SIGNATURES",
      severity: "high",
      message: "Le contrat doit etre signe par les deux parties.",
    });
  }

  const riskScore = Math.min(
    100,
    issues.reduce((acc, issue) => {
      if (issue.severity === "high") return acc + 24;
      if (issue.severity === "medium") return acc + 14;
      return acc + 7;
    }, 0),
  );
  const level: FixedTermContractRiskResult["level"] =
    riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  const recommendationCodes = [
    !input.contractReasonDocumented ? "document_reason" : null,
    !input.contractHasEndDate ? "define_end_date" : null,
    input.durationMonths > 24 ? "justify_duration" : null,
    input.renewalsCount >= 2 ? "limit_renewals" : null,
    input.roleIsPermanentNeed ? "consider_cdi" : null,
    input.trialPeriodDays > 30 ? "review_trial_period" : null,
    !input.salaryAndHoursClear ? "clarify_terms" : null,
    !input.signedByBothParties ? "collect_signatures" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    riskScore,
    level,
    recommendationCodes,
    issues,
  };
}
