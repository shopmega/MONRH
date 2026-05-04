import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import {
  getCurrentDateISO,
  type CalculatorExplanation,
  roundMAD,
} from "@/lib/calculators/shared";
import {
  addSenioritySourceIssues,
  cddMissingInformation,
  cddRuptureReasonSchema,
  cddRuptureSummary,
  contractTypeSchema,
  normalizeLegacySeniorityInput,
  resolveServiceYears,
  ruptureInitiatorSchema,
  seniorityInputModeSchema,
  workerCategorySchema,
} from "@/lib/calculators/legal-core";

const dureePreavisBaseInputSchema = z
  .object({
    calculationDate: z.string().date().default(getCurrentDateISO),
    contractType: contractTypeSchema.default("CDI"),
    workerCategory: workerCategorySchema.default("employe"),
    seniorityInputMode: seniorityInputModeSchema.default("hire_date"),
    hireDate: z.string().date().optional(),
    yearsOfService: z.number().min(0).max(60).optional(),
    monthsOfService: z.number().min(0).max(11).optional(),
    notificationDate: z.string().date().optional(),
    ruptureInitiator: ruptureInitiatorSchema.default("salarie"),
    cddRuptureReason: cddRuptureReasonSchema.optional(),
  })
  .superRefine((input, ctx) => {
    addSenioritySourceIssues(input, ctx);
    if (input.contractType === "CDD" && !input.cddRuptureReason) {
      ctx.addIssue({
        code: "custom",
        path: ["cddRuptureReason"],
        message: "cddRuptureReason is required for CDD notice analysis.",
      });
    }
  });

export const dureePreavisInputSchema = z.preprocess(
  normalizeLegacySeniorityInput,
  dureePreavisBaseInputSchema,
);

export type DureePreavisInput = z.input<typeof dureePreavisInputSchema>;
type ParsedDureePreavisInput = z.output<typeof dureePreavisInputSchema>;

export type DureePreavisResult = {
  versionId: string;
  versionCode: string;
  inputMode: "hire_date" | "manual_unknown_hire_date";
  legalBasis: string[];
  missingInformation: string[];
  documentPrefill: Record<string, string | number | boolean | undefined>;
  breakdown: {
    contractType: "CDI" | "CDD";
    workerCategory: "cadre" | "employe" | "ouvrier";
    hireDate?: string;
    notificationDate: string;
    ruptureInitiator: "salarie" | "employeur";
    cddRuptureReason?: string;
    serviceInputMode: "hire_date" | "manual_unknown_hire_date";
    totalServiceYears: number;
    requiredNoticeMonths: number;
    requiredNoticeDays: number;
    noticeLegalStatus: string;
  };
  explanation: CalculatorExplanation;
};

function cdiNoticeMonths(
  totalYears: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
  workerCategory: ParsedDureePreavisInput["workerCategory"],
): number {
  const noticeRules = rules.cdiNoticeRulesByCategory?.[workerCategory];
  const matchedNotice = noticeRules?.find(
    (rule) => totalYears >= rule.minYears && (rule.maxYears === null || totalYears < rule.maxYears),
  );
  if (matchedNotice?.unit === "month") return matchedNotice.value;
  if (matchedNotice?.unit === "day") return matchedNotice.value / 26;

  const category = rules.cdiNoticeMonthsByCategory[workerCategory];
  if (totalYears < 1) return category.lt1;
  if (totalYears < 5) return category.gte1lt5;
  return category.gte5;
}

export function simulateDureePreavis(rawInput: DureePreavisInput): DureePreavisResult {
  const input = dureePreavisInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const notificationDate = input.notificationDate ?? input.calculationDate;

  const totalServiceYears = resolveServiceYears(input);
  const serviceInputMode = input.seniorityInputMode;
  const requiredNoticeMonths =
    input.contractType === "CDI"
      ? cdiNoticeMonths(totalServiceYears, rules, input.workerCategory)
      : 0;
  const requiredNoticeDays =
    input.contractType === "CDD" ? 0 : Math.round(requiredNoticeMonths * 26);
  const cddStatus = cddRuptureSummary(input.cddRuptureReason);
  const cddMissing = input.contractType === "CDD" ? cddMissingInformation(input.cddRuptureReason) : [];
  const legalBasis =
    input.contractType === "CDI"
      ? [
          "Code du travail marocain, articles 43 a 51.",
          "Decret n 2-04-469 relatif au delai de preavis pour la rupture unilaterale du CDI.",
        ]
      : [
          "Le Decret n 2-04-469 vise la rupture unilaterale du CDI.",
          "Le CDD doit etre qualifie selon son terme, un accord amiable, la faute grave, la force majeure ou une rupture anticipee.",
        ];

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    inputMode: serviceInputMode,
    legalBasis,
    missingInformation: cddMissing,
    documentPrefill: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      hireDate: input.hireDate,
      noticeStartDate: notificationDate,
      effectiveDepartureDate: notificationDate,
    },
    breakdown: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      ...(input.hireDate ? { hireDate: input.hireDate } : {}),
      notificationDate,
      ruptureInitiator: input.ruptureInitiator,
      ...(input.cddRuptureReason ? { cddRuptureReason: input.cddRuptureReason } : {}),
      serviceInputMode,
      totalServiceYears: roundMAD(totalServiceYears),
      requiredNoticeMonths,
      requiredNoticeDays,
      noticeLegalStatus:
        input.contractType === "CDI"
          ? "calculable_cdi"
          : "cdd_requires_rupture_basis",
    },
    explanation: {
      summary:
        input.contractType === "CDI"
          ? `Preavis estime: ${requiredNoticeMonths} mois (${requiredNoticeDays} jours approx.).`
          : `CDD: ${cddStatus}`,
      assumptions: [
        `Type de contrat: ${input.contractType}.`,
        `Categorie professionnelle: ${input.workerCategory}.`,
        input.contractType === "CDI"
          ? `Anciennete retenue: ${roundMAD(totalServiceYears)} ans.`
          : cddStatus,
        serviceInputMode === "hire_date"
          ? "Anciennete calculee depuis la date d'embauche."
          : "Anciennete saisie manuellement car la date d'embauche est inconnue.",
      ],
      formulas: [
        "CDI: preavis par tranche d'anciennete et categorie, avec unite jour/mois issue des regles actives.",
        "CDD: aucun preavis legal standard n'est calcule sans qualification de la rupture.",
      ],
      warnings: [
        "Certaines conventions collectives peuvent prevoir des preavis differents.",
        "Les jours CDI sont affiches a titre indicatif (conversion paie 1 mois = 26 jours ouvrables).",
        ...(input.contractType === "CDD"
          ? [
              "Ne pas appliquer automatiquement le bareme CDI a un CDD.",
              "Une rupture anticipee de CDD peut exposer la partie responsable a un risque indemnitaire.",
            ]
          : []),
      ],
      missingInformation: cddMissing,
      nextSteps: [
        "Verifier la convention collective et les clauses du contrat.",
        "Conserver une preuve ecrite de notification du preavis.",
        ...(input.contractType === "CDD"
          ? ["Qualifier le motif CDD avant toute notification ou estimation financiere."]
          : []),
      ],
    },
  };
}
