import { z } from "zod";
import { getLeaveRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, serviceYearsFromPeriod } from "@/lib/calculators/shared";

export const leaveAccrualInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  monthsWorked: z.number().min(0).max(720),
  hireDate: z.string().date().optional(),
  seniorityYears: z.number().min(0).max(60).default(0),
  usedLeaveDays: z.number().min(0).max(365).default(0),
  carriedDays: z.number().min(0).max(365).default(0),
});

export type LeaveAccrualInput = z.infer<typeof leaveAccrualInputSchema>;

export type LeaveAccrualResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    accrualDays: number;
    hireDate?: string;
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
  };
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function simulateLeaveAccrual(rawInput: LeaveAccrualInput): LeaveAccrualResult {
  const input = leaveAccrualInputSchema.parse(rawInput);
  const rules = getLeaveRulesByDate(input.calculationDate);
  const seniorityYears = serviceYearsFromPeriod({
    hireDate: input.hireDate,
    calculationDate: input.calculationDate,
    yearsOfService: input.seniorityYears,
  });

  const accrualDays = input.monthsWorked * rules.accrualDaysPerMonth;
  const seniorityBonusDays =
    seniorityYears >= 5
      ? input.monthsWorked * rules.seniorityBonusDaysPerMonthAfter5Years
      : 0;
  const totalAvailableDays = accrualDays + seniorityBonusDays + input.carriedDays;
  const remainingDays = Math.max(0, totalAvailableDays - input.usedLeaveDays);
  const carryoverAfterLimit = Math.min(remainingDays, rules.carryoverLimitDays);

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      accrualDays: round(accrualDays),
      ...(input.hireDate ? { hireDate: input.hireDate } : {}),
      seniorityYears: round(seniorityYears),
      seniorityBonusDays: round(seniorityBonusDays),
      totalAvailableDays: round(totalAvailableDays),
      usedLeaveDays: round(input.usedLeaveDays),
      remainingDays: round(remainingDays),
      carryoverAfterLimit: round(carryoverAfterLimit),
    },
    explanation: {
      summary: `Vous disposez d'environ ${round(remainingDays)} jours de conges restants sur la periode saisie.`,
      assumptions: [
        "Acquisition de base calculee sur 1.5 jour par mois.",
        seniorityYears >= 5
          ? "Bonus anciennete applique (anciennete >= 5 ans)."
          : "Pas de bonus anciennete applique (anciennete < 5 ans).",
        "Le reliquat saisi est ajoute avant deduction des jours consommes.",
      ],
      formulas: [
        "Acquis = mois travailles x taux d'acquisition.",
        "Disponible = acquis + bonus + reliquat.",
        "Restant = disponible - conges utilises.",
      ],
      warnings: [
        "Certaines entreprises appliquent des politiques internes de report differentes.",
        "Le reliquat reportable est plafonne selon la regle legale active.",
      ],
      nextSteps: [
        "Comparer ce calcul avec le compteur conges sur bulletin ou portail RH.",
        "Conserver une trace mensuelle pour anticiper les demandes de conge.",
      ],
    },
  };
}
