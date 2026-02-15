import { z } from "zod";

export const disciplinaryProcedureCheckInputSchema = z.object({
  hasWrittenNotice: z.boolean(),
  noticeDescribesFacts: z.boolean(),
  hearingHeld: z.boolean(),
  hearingNoticeHours: z.number().min(0).max(240).default(0),
  employeeCanDefend: z.boolean(),
  sanctionWithinReasonableDelay: z.boolean(),
  priorSanctionsDocumented: z.boolean(),
  hasProofArchive: z.boolean(),
});

export type DisciplinaryProcedureCheckInput = z.infer<
  typeof disciplinaryProcedureCheckInputSchema
>;

export type DisciplinaryProcedureCheckResult = {
  riskScore: number;
  level: "low" | "medium" | "high";
  recommendationCodes: string[];
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export function checkDisciplinaryProcedure(
  rawInput: DisciplinaryProcedureCheckInput,
): DisciplinaryProcedureCheckResult {
  const input = disciplinaryProcedureCheckInputSchema.parse(rawInput);
  const issues: DisciplinaryProcedureCheckResult["issues"] = [];

  if (!input.hasWrittenNotice) {
    issues.push({
      code: "NO_WRITTEN_NOTICE",
      severity: "high",
      message: "Absence de notification ecrite de la procedure.",
    });
  }
  if (!input.noticeDescribesFacts) {
    issues.push({
      code: "NOTICE_FACTS_MISSING",
      severity: "medium",
      message: "Les faits reproches ne sont pas suffisamment precis.",
    });
  }
  if (!input.hearingHeld) {
    issues.push({
      code: "NO_HEARING",
      severity: "high",
      message: "Absence d'entretien disciplinaire contradictoire.",
    });
  }
  if (input.hearingHeld && input.hearingNoticeHours < 24) {
    issues.push({
      code: "HEARING_NOTICE_TOO_SHORT",
      severity: "medium",
      message: "Delai de convocation potentiellement insuffisant.",
    });
  }
  if (!input.employeeCanDefend) {
    issues.push({
      code: "DEFENSE_RIGHT_LIMITED",
      severity: "high",
      message: "Le droit de defense du salarie parait limite.",
    });
  }
  if (!input.sanctionWithinReasonableDelay) {
    issues.push({
      code: "DELAY_TOO_LONG",
      severity: "medium",
      message: "Le delai entre faits et sanction peut etre contestable.",
    });
  }
  if (!input.priorSanctionsDocumented) {
    issues.push({
      code: "NO_PRIOR_DOCUMENTATION",
      severity: "low",
      message: "Les antecedents disciplinaires ne sont pas documentes.",
    });
  }
  if (!input.hasProofArchive) {
    issues.push({
      code: "NO_PROOF_ARCHIVE",
      severity: "medium",
      message: "Le dossier de preuves est incomplet.",
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

  const level: DisciplinaryProcedureCheckResult["level"] =
    riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  const recommendationCodes = [
    !input.hasWrittenNotice ? "written_notice" : null,
    !input.noticeDescribesFacts ? "facts_detail" : null,
    !input.hearingHeld ? "hearing" : null,
    input.hearingHeld && input.hearingNoticeHours < 24 ? "hearing_notice_time" : null,
    !input.employeeCanDefend ? "defense_rights" : null,
    !input.sanctionWithinReasonableDelay ? "timing" : null,
    !input.priorSanctionsDocumented ? "prior_docs" : null,
    !input.hasProofArchive ? "proof_archive" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    riskScore,
    level,
    recommendationCodes,
    issues,
  };
}
