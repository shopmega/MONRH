import { z } from "zod";
import { getLeaveRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, serviceYearsFromHireDate } from "@/lib/calculators/shared";

function normalizeLegacyLeaveInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const input = raw as Record<string, unknown>;
  if (
    input.leavePeriodInputMode === undefined &&
    input.hireDate === undefined &&
    input.monthsWorked !== undefined
  ) {
    return {
      ...input,
      leavePeriodInputMode: "manual_unknown_hire_date",
    };
  }
  return raw;
}

const leaveAccrualBaseInputSchema = z
  .object({
    calculationDate: z.string().date().default(getCurrentDateISO),
    leavePeriodInputMode: z.enum(["hire_date", "manual_unknown_hire_date"]).default("hire_date"),
    hireDate: z.string().date().optional(),
    monthsWorked: z.number().min(0).max(720).optional(),
    seniorityYears: z.number().min(0).max(60).optional(),
    usedLeaveDays: z.number().min(0).max(365).default(0),
    carriedDays: z.number().min(0).max(365).default(0),
  })
  .superRefine((input, ctx) => {
    const hasManualPeriod = input.monthsWorked !== undefined || input.seniorityYears !== undefined;
    if (input.hireDate && hasManualPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["hireDate"],
        message: "Conflicting inputs: use either hireDate or manual leave period, never both.",
      });
    }
    if (input.leavePeriodInputMode === "hire_date" && !input.hireDate) {
      ctx.addIssue({
        code: "custom",
        path: ["hireDate"],
        message: "hireDate is required when leavePeriodInputMode is hire_date.",
      });
    }
    if (input.leavePeriodInputMode === "manual_unknown_hire_date" && input.hireDate) {
      ctx.addIssue({
        code: "custom",
        path: ["leavePeriodInputMode"],
        message: "manual_unknown_hire_date cannot be combined with hireDate.",
      });
    }
  });

export const leaveAccrualInputSchema = z.preprocess(
  normalizeLegacyLeaveInput,
  leaveAccrualBaseInputSchema,
);

export type LeaveAccrualInput = z.input<typeof leaveAccrualInputSchema>;

export type LeaveAccrualResult = {
  versionId: string;
  versionCode: string;
  inputMode: "hire_date" | "manual_unknown_hire_date";
  breakdown: {
    accrualDays: number;
    hireDate?: string;
    monthsWorked: number;
    seniorityYears: number;
    seniorityBonusDays: number;
    totalAvailableDays: number;
    usedLeaveDays: number;
    remainingDays: number;
    carryoverAfterLimit: number;
  };
  explanation: {
    summary: string;
    assumptions: string[];
    formulas: string[];
    warnings: string[];
    nextSteps: string[];
    missingInformation?: string[];
  };
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function monthsBetween(hireDateISO: string, calculationDateISO: string) {
  const hireDate = new Date(hireDateISO);
  const calculationDate = new Date(calculationDateISO);
  let totalMonths =
    (calculationDate.getFullYear() - hireDate.getFullYear()) * 12 +
    (calculationDate.getMonth() - hireDate.getMonth());
  if (calculationDate.getDate() < hireDate.getDate()) {
    totalMonths -= 1;
  }
  return Math.max(0, totalMonths);
}

export function simulateLeaveAccrual(rawInput: LeaveAccrualInput): LeaveAccrualResult {
  const input = leaveAccrualInputSchema.parse(rawInput);
  const rules = getLeaveRulesByDate(input.calculationDate);
  const seniorityYears =
    input.leavePeriodInputMode === "hire_date"
      ? serviceYearsFromHireDate(input.hireDate as string, input.calculationDate)
      : input.seniorityYears ?? 0;
  const monthsWorked =
    input.leavePeriodInputMode === "hire_date"
      ? monthsBetween(input.hireDate as string, input.calculationDate)
      : input.monthsWorked ?? 0;

  const accrualDays = monthsWorked * rules.accrualDaysPerMonth;
  const bonusEveryYears = rules.seniorityBonusEveryYears ?? 5;
  const completedBonusPeriods = bonusEveryYears > 0 ? Math.floor(seniorityYears / bonusEveryYears) : 0;
  const seniorityBonusDays = (completedBonusPeriods * (rules.seniorityBonusDays ?? 1.5) * monthsWorked) / 12;
  const maxAccruedDaysForPeriod = ((rules.maxAnnualDays ?? Number.POSITIVE_INFINITY) * monthsWorked) / 12;
  const cappedAccruedDays = Math.min(accrualDays + seniorityBonusDays, maxAccruedDaysForPeriod);
  const totalAvailableDays = cappedAccruedDays + input.carriedDays;
  const remainingDays = Math.max(0, totalAvailableDays - input.usedLeaveDays);
  const carryoverAfterLimit = Math.min(remainingDays, rules.carryoverLimitDays);

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    inputMode: input.leavePeriodInputMode,
    breakdown: {
      accrualDays: round(accrualDays),
      ...(input.hireDate ? { hireDate: input.hireDate } : {}),
      monthsWorked: round(monthsWorked),
      seniorityYears: round(seniorityYears),
      seniorityBonusDays: round(seniorityBonusDays),
      totalAvailableDays: round(totalAvailableDays),
      usedLeaveDays: round(input.usedLeaveDays),
      remainingDays: round(remainingDays),
      carryoverAfterLimit: round(carryoverAfterLimit),
    },
    explanation: {
      summary: `Vous disposez d'environ ${round(remainingDays)} jours de conges restants sur la periode calculee.`,
      assumptions: [
        "Acquisition de base calculee sur 1.5 jour par mois.",
        input.leavePeriodInputMode === "hire_date"
          ? "Mois travailles et anciennete derives de la date d'embauche."
          : "Mois travailles et anciennete saisis manuellement car la date d'embauche est inconnue.",
        seniorityYears >= 5
          ? `Bonus anciennete applique: +${rules.seniorityBonusDays ?? 1.5} jour(s) par periode complete de ${bonusEveryYears} ans, prorate sur la periode.`
          : "Pas de bonus anciennete applique (anciennete < 5 ans).",
        `Droits annuels plafonnes a ${rules.maxAnnualDays ?? "non configure"} jours avant report interne.`,
        "Le reliquat saisi est ajoute avant deduction des jours consommes.",
      ],
      formulas: [
        "Acquis = mois travailles x taux d'acquisition.",
        "Disponible = min(acquis + bonus anciennete, plafond annuel prorate) + reliquat.",
        "Restant = disponible - conges utilises.",
      ],
      warnings: [
        "Certaines entreprises appliquent des politiques internes de report differentes.",
        "Le reliquat reportable est plafonne selon la politique interne/conventionnelle configuree.",
      ],
      missingInformation:
        input.leavePeriodInputMode === "manual_unknown_hire_date" ? ["Date d'embauche"] : [],
      nextSteps: [
        "Comparer ce calcul avec le compteur conges sur bulletin ou portail RH.",
        "Conserver une trace mensuelle pour anticiper les demandes de conge.",
      ],
    },
  };
}
