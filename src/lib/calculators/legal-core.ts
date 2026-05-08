import { z } from "zod";
import {
  serviceYearsFromHireDate,
} from "@/lib/calculators/shared";

export const contractTypeSchema = z.enum(["CDI", "CDD"]);
export const workerCategorySchema = z.enum(["cadre", "employe", "ouvrier"]);
export const seniorityInputModeSchema = z.enum(["hire_date", "manual_unknown_hire_date"]);
export const ruptureInitiatorSchema = z.enum(["salarie", "employeur"]);
export const noticeStatusSchema = z.enum(["served", "not_served", "waived_by_employer", "negotiated_release"]);
export const cddRuptureReasonSchema = z.enum([
  "term_expiry",
  "mutual_agreement",
  "serious_misconduct",
  "force_majeure",
  "early_unilateral_employee",
  "early_unilateral_employer",
  "unknown",
]);

export type ContractType = z.infer<typeof contractTypeSchema>;
export type WorkerCategory = z.infer<typeof workerCategorySchema>;
export type SeniorityInputMode = z.infer<typeof seniorityInputModeSchema>;
export type CddRuptureReason = z.infer<typeof cddRuptureReasonSchema>;

export function normalizeLegacySeniorityInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const input = raw as Record<string, unknown>;
  if (
    input.seniorityInputMode === undefined &&
    input.hireDate === undefined &&
    (input.yearsOfService !== undefined || input.monthsOfService !== undefined)
  ) {
    return {
      ...input,
      seniorityInputMode: "manual_unknown_hire_date",
    };
  }
  return raw;
}

export function addSenioritySourceIssues(
  input: {
    seniorityInputMode?: SeniorityInputMode;
    hireDate?: string;
    yearsOfService?: number;
    monthsOfService?: number;
  },
  ctx: z.RefinementCtx,
) {
  const hasManualSeniority =
    input.yearsOfService !== undefined || input.monthsOfService !== undefined;

  if (input.hireDate && hasManualSeniority) {
    ctx.addIssue({
      code: "custom",
      path: ["hireDate"],
      message: "Conflicting inputs: use either hireDate or manual seniority, never both.",
    });
  }

  if (input.seniorityInputMode === "hire_date" && !input.hireDate) {
    ctx.addIssue({
      code: "custom",
      path: ["hireDate"],
      message: "hireDate is required when seniorityInputMode is hire_date.",
    });
  }

  if (input.seniorityInputMode === "manual_unknown_hire_date" && input.hireDate) {
    ctx.addIssue({
      code: "custom",
      path: ["seniorityInputMode"],
      message: "manual_unknown_hire_date cannot be combined with hireDate.",
    });
  }
}

export function resolveServiceYears(input: {
  seniorityInputMode: SeniorityInputMode;
  hireDate?: string;
  calculationDate: string;
  yearsOfService?: number;
  monthsOfService?: number;
}) {
  if (input.seniorityInputMode === "hire_date") {
    if (!input.hireDate) {
      throw new Error("hireDate is required to calculate seniority.");
    }
    return serviceYearsFromHireDate(input.hireDate, input.calculationDate);
  }

  return (input.yearsOfService ?? 0) + (input.monthsOfService ?? 0) / 12;
}

export function cddRuptureSummary(reason?: CddRuptureReason): string {
  switch (reason) {
    case "term_expiry":
      return "Fin normale du CDD a son terme.";
    case "mutual_agreement":
      return "Rupture d'un commun accord entre les parties.";
    case "serious_misconduct":
      return "Rupture fondee sur une faute grave alleguee.";
    case "force_majeure":
      return "Rupture fondee sur un cas de force majeure allegue.";
    case "early_unilateral_employee":
      return "Rupture anticipee unilaterale par le salarie: risque juridique a qualifier.";
    case "early_unilateral_employer":
      return "Rupture anticipee unilaterale par l'employeur: risque juridique a qualifier.";
    default:
      return "Motif CDD non precise: aucun preavis standard ne peut etre calcule de maniere fiable.";
  }
}

export function cddMissingInformation(reason?: CddRuptureReason): string[] {
  if (!reason || reason === "unknown") {
    return [
      "Motif exact de rupture du CDD",
      "Clause contractuelle ou accord ecrit applicable",
      "Date de fin normale du CDD",
    ];
  }
  if (reason === "early_unilateral_employee" || reason === "early_unilateral_employer") {
    return [
      "Preuve de l'accord amiable, faute grave ou force majeure si invoque",
      "Evaluation du prejudice eventuel lie a la rupture anticipee",
    ];
  }
  return [];
}
