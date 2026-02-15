import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import { roundMAD } from "@/lib/calculators/shared";

export const finalSettlementAuditInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  contractType: z.enum(["CDI", "CDD"]).default("CDI"),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  yearsOfService: z.number().min(0).max(60),
  monthsOfService: z.number().min(0).max(11).default(0),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  unpaidSalaryMonths: z.number().min(0).max(36).default(0),
  overtimeDueMad: z.number().min(0).default(0),
  noticeAlreadyPaid: z.boolean().default(false),
  abusiveDismissal: z.boolean().default(false),
});

export type FinalSettlementAuditInput = z.infer<typeof finalSettlementAuditInputSchema>;

export type FinalSettlementAuditResult = {
  versionCode: string;
  level: "low" | "medium" | "high";
  riskScore: number;
  breakdown: {
    contractType: "CDI" | "CDD";
    workerCategory: "cadre" | "employe" | "ouvrier";
    totalServiceYears: number;
    indemnityLegale: number;
    indemnitePreavis: number;
    congesPayesRestants: number;
    salaryArrears: number;
    overtimeArrears: number;
    dommagesAbusif: number;
    totalEstimatedDue: number;
  };
  issues: Array<{
    code:
      | "UNPAID_SALARY"
      | "OVERTIME_DUE"
      | "NOTICE_MAY_BE_DUE"
      | "LEAVE_BALANCE_DUE"
      | "ABUSIVE_DISMISSAL_RISK";
    severity: "low" | "medium" | "high";
    message: string;
    amount?: number;
  }>;
};

function roundYears(value: number) {
  return Math.round(value * 1000) / 1000;
}

function noticeMonths(
  totalYears: number,
  categoryRules: { lt1: number; gte1lt5: number; gte5: number },
) {
  if (totalYears < 1) return categoryRules.lt1;
  if (totalYears < 5) return categoryRules.gte1lt5;
  return categoryRules.gte5;
}

function indemnityHours(
  totalYears: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
) {
  const tranche1Years = Math.min(totalYears, 5);
  const tranche2Years = Math.min(Math.max(totalYears - 5, 0), 5);
  const tranche3Years = Math.min(Math.max(totalYears - 10, 0), 5);
  const tranche4Years = Math.max(totalYears - 15, 0);

  return (
    tranche1Years * rules.tranche1HoursPerYear +
    tranche2Years * rules.tranche2HoursPerYear +
    tranche3Years * rules.tranche3HoursPerYear +
    tranche4Years * rules.tranche4HoursPerYear
  );
}

export function auditFinalSettlement(
  rawInput: FinalSettlementAuditInput,
): FinalSettlementAuditResult {
  const input = finalSettlementAuditInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const totalServiceYears = input.yearsOfService + input.monthsOfService / 12;
  const hourlySalary = input.monthlySalary / 191;
  const legalHours = indemnityHours(totalServiceYears, rules);

  const indemnityLegale =
    input.contractType === "CDI" ? hourlySalary * legalHours : 0;
  const indemnitePreavis = input.noticeAlreadyPaid
    ? 0
    : input.contractType === "CDI"
      ? input.monthlySalary *
        noticeMonths(totalServiceYears, rules.cdiNoticeMonthsByCategory[input.workerCategory])
      : (input.monthlySalary / 26) * rules.cddNoticeDaysByCategory[input.workerCategory];
  const congesPayesRestants = (input.monthlySalary / 26) * input.unusedLeaveDays;
  const salaryArrears = input.monthlySalary * input.unpaidSalaryMonths;
  const overtimeArrears = input.overtimeDueMad;
  const abusiveMonths = Math.min(
    totalServiceYears * rules.abusiveBaseMonthsPerYear,
    rules.abusiveCapMonths,
  );
  const dommagesAbusif =
    input.contractType === "CDI" && input.abusiveDismissal
      ? abusiveMonths * input.monthlySalary
      : 0;

  const totalEstimatedDue =
    indemnityLegale +
    indemnitePreavis +
    congesPayesRestants +
    salaryArrears +
    overtimeArrears +
    dommagesAbusif;

  const issues: FinalSettlementAuditResult["issues"] = [];
  if (salaryArrears > 0) {
    issues.push({
      code: "UNPAID_SALARY",
      severity: salaryArrears >= input.monthlySalary * 2 ? "high" : "medium",
      message: "Salaires impayes detectes dans le solde final.",
      amount: roundMAD(salaryArrears),
    });
  }
  if (overtimeArrears > 0) {
    issues.push({
      code: "OVERTIME_DUE",
      severity: overtimeArrears >= input.monthlySalary * 0.2 ? "medium" : "low",
      message: "Heures supplementaires non reglees.",
      amount: roundMAD(overtimeArrears),
    });
  }
  if (!input.noticeAlreadyPaid && indemnitePreavis > 0) {
    issues.push({
      code: "NOTICE_MAY_BE_DUE",
      severity: "medium",
      message: "Indemnite de preavis potentiellement due.",
      amount: roundMAD(indemnitePreavis),
    });
  }
  if (congesPayesRestants > 0) {
    issues.push({
      code: "LEAVE_BALANCE_DUE",
      severity: congesPayesRestants >= input.monthlySalary * 0.5 ? "medium" : "low",
      message: "Solde de conges payes restant a regler.",
      amount: roundMAD(congesPayesRestants),
    });
  }
  if (dommagesAbusif > 0) {
    issues.push({
      code: "ABUSIVE_DISMISSAL_RISK",
      severity: "high",
      message: "Risque de dommages pour licenciement abusif.",
      amount: roundMAD(dommagesAbusif),
    });
  }

  const riskScore = Math.max(
    0,
    100 -
      issues.reduce((acc, issue) => {
        if (issue.severity === "high") return acc + 28;
        if (issue.severity === "medium") return acc + 16;
        return acc + 8;
      }, 0),
  );
  const level: FinalSettlementAuditResult["level"] =
    riskScore >= 70 ? "low" : riskScore >= 40 ? "medium" : "high";

  return {
    versionCode: rules.versionCode,
    level,
    riskScore,
    breakdown: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      totalServiceYears: roundYears(totalServiceYears),
      indemnityLegale: roundMAD(indemnityLegale),
      indemnitePreavis: roundMAD(indemnitePreavis),
      congesPayesRestants: roundMAD(congesPayesRestants),
      salaryArrears: roundMAD(salaryArrears),
      overtimeArrears: roundMAD(overtimeArrears),
      dommagesAbusif: roundMAD(dommagesAbusif),
      totalEstimatedDue: roundMAD(totalEstimatedDue),
    },
    issues,
  };
}
