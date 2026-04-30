import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";
import {
  formatDateOnly,
  getCurrentDateISO,
  parseDateOnly,
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
  noticeStatusSchema,
  resolveServiceYears,
  seniorityInputModeSchema,
  workerCategorySchema,
} from "@/lib/calculators/legal-core";

function normalizeLegacyDemissionInput(raw: unknown): unknown {
  const normalized = normalizeLegacySeniorityInput(raw);
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) return normalized;
  const input = normalized as Record<string, unknown>;
  if (input.noticeStatus === undefined && typeof input.noticeServed === "boolean") {
    return {
      ...input,
      noticeStatus: input.noticeServed ? "served" : "not_served",
    };
  }
  return normalized;
}

const demissionBaseInputSchema = z
  .object({
    calculationDate: z.string().date().default(getCurrentDateISO),
    monthlySalary: z.number().positive(),
    workerCategory: workerCategorySchema.default("employe"),
    contractType: contractTypeSchema.default("CDI"),
    seniorityInputMode: seniorityInputModeSchema.default("hire_date"),
    hireDate: z.string().date().optional(),
    yearsOfService: z.number().min(0).max(60).optional(),
    monthsOfService: z.number().min(0).max(11).optional(),
    resignationNotificationDate: z.string().date().optional(),
    unusedLeaveDays: z.number().min(0).max(365).default(0),
    noticeStatus: noticeStatusSchema.default("served"),
    cddRuptureReason: cddRuptureReasonSchema.optional(),
  })
  .superRefine((input, ctx) => {
    addSenioritySourceIssues(input, ctx);
    if (input.contractType === "CDD" && !input.cddRuptureReason) {
      ctx.addIssue({
        code: "custom",
        path: ["cddRuptureReason"],
        message: "cddRuptureReason is required for CDD resignation analysis.",
      });
    }
  });

export const demissionInputSchema = z.preprocess(
  normalizeLegacyDemissionInput,
  demissionBaseInputSchema,
);

export type DemissionInput = z.input<typeof demissionInputSchema>;
type ParsedDemissionInput = z.output<typeof demissionInputSchema>;

export type DemissionResult = {
  versionId: string;
  versionCode: string;
  inputMode: "hire_date" | "manual_unknown_hire_date";
  legalBasis: string[];
  missingInformation: string[];
  documentPrefill: Record<string, string | number | boolean | undefined>;
  breakdown: {
    contractType: string;
    workerCategory: string;
    hireDate?: string;
    resignationNotificationDate: string;
    cddRuptureReason?: string;
    totalServiceYears: number;
    requiredNoticeMonths: number;
    requiredNoticeDays: number;
    recommendedDepartureDate: string;
    leavePayout: number;
    noticeComplianceStatus: string;
    potentialNoticeValue: number;
    netFinancialOutcome: number;
    cddNote?: string;
  };
  explanation: CalculatorExplanation;
};

function categoryNoticeMonths(
  totalYears: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
  category: ParsedDemissionInput["workerCategory"],
): number {
  const map = rules.cdiNoticeMonthsByCategory[category];
  if (totalYears < 1) return map.lt1;
  if (totalYears < 5) return map.gte1lt5;
  return map.gte5;
}

function addMonths(dateISO: string, months: number): string {
  const date = parseDateOnly(dateISO);
  date.setMonth(date.getMonth() + months);
  return formatDateOnly(date);
}

function addDays(dateISO: string, days: number): string {
  const date = parseDateOnly(dateISO);
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

export function simulateDemission(rawInput: DemissionInput): DemissionResult {
  const input = demissionInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const totalServiceYears = resolveServiceYears(input);
  const resignationNotificationDate = input.resignationNotificationDate ?? input.calculationDate;

  const requiredNoticeMonths =
    input.contractType === "CDD"
      ? 0
      : categoryNoticeMonths(totalServiceYears, rules, input.workerCategory);
  const requiredNoticeDays =
    input.contractType === "CDD" ? 0 : Math.round(requiredNoticeMonths * 30);
  const leavePayout = roundMAD((input.monthlySalary / 26) * input.unusedLeaveDays);

  const potentialNoticeValue =
    input.contractType === "CDI" && input.noticeStatus === "not_served"
      ? roundMAD(input.monthlySalary * requiredNoticeMonths)
      : 0;

  const recommendedDepartureDate =
    input.noticeStatus === "served" && input.contractType === "CDI"
      ? requiredNoticeMonths < 1
        ? addDays(resignationNotificationDate, requiredNoticeDays)
        : addMonths(resignationNotificationDate, requiredNoticeMonths)
      : resignationNotificationDate;

  const netFinancialOutcome = roundMAD(leavePayout);
  const missingInformation =
    input.contractType === "CDD" ? cddMissingInformation(input.cddRuptureReason) : [];
  const legalBasis =
    input.contractType === "CDI"
      ? [
          "Code du travail marocain, articles 43 a 51.",
          "Decret n 2-04-469 relatif au delai de preavis pour la rupture unilaterale du CDI.",
        ]
      : [
          "Le Decret n 2-04-469 vise la rupture unilaterale du CDI.",
          "La rupture d'un CDD doit etre qualifiee selon son terme, un accord amiable, la faute grave, la force majeure ou une rupture anticipee.",
        ];

  const summaryText =
    netFinancialOutcome > 0
      ? `Resultat net de demission estime: ${netFinancialOutcome} MAD (paiement conges restants).`
      : `Aucun paiement du: ${netFinancialOutcome} MAD (pas de conges restants).`;

  const dynamicWarnings = [
    "La demission ne donne pas droit a l'indemnite de licenciement.",
    "Certaines conventions collectives prevoient des preavis differents - verifier.",
    input.contractType === "CDD"
      ? "La rupture anticipee d'un CDD par le salarie peut engager sa responsabilite civile; aucun preavis CDI ne doit etre applique automatiquement."
      : "",
  ];

  if (input.contractType === "CDI" && input.noticeStatus === "not_served") {
    dynamicWarnings.push(
      `Preavis non servi: ${potentialNoticeValue} MAD de salaire potentiellement concerne.`,
      "L'employeur peut engager une action en dommages et interets mais ne peut pas retenir le solde de tout compte.",
      "Il est recommande de servir le preavis ou de negocier un accord amiable.",
    );
  }

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    inputMode: input.seniorityInputMode,
    legalBasis,
    missingInformation,
    documentPrefill: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      hireDate: input.hireDate,
      noticeStartDate: resignationNotificationDate,
      effectiveDepartureDate: recommendedDepartureDate,
      amountDue: leavePayout,
    },
    breakdown: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      ...(input.hireDate ? { hireDate: input.hireDate } : {}),
      resignationNotificationDate,
      ...(input.cddRuptureReason ? { cddRuptureReason: input.cddRuptureReason } : {}),
      totalServiceYears: roundMAD(totalServiceYears),
      requiredNoticeMonths,
      requiredNoticeDays,
      recommendedDepartureDate,
      leavePayout,
      noticeComplianceStatus: input.noticeStatus,
      potentialNoticeValue,
      netFinancialOutcome,
      ...(input.contractType === "CDD" ? { cddNote: cddRuptureSummary(input.cddRuptureReason) } : {}),
    },
    explanation: {
      summary: summaryText,
      assumptions: [
        `Categorie: ${input.workerCategory}.`,
        `Type de contrat: ${input.contractType}.`,
        input.contractType === "CDI"
          ? `Anciennete: ${roundMAD(totalServiceYears)} ans -> preavis requis: ${requiredNoticeMonths} mois.`
          : cddRuptureSummary(input.cddRuptureReason),
        input.noticeStatus === "served"
          ? "Preavis execute: situation reguliere."
          : `Statut du preavis: ${input.noticeStatus}.`,
        "Conges restants valorises en salaire journalier (salaire / 26).",
        "Aucune retenue automatique sur solde de tout compte pour demission.",
      ],
      formulas: [
        "Indemnite conges = (salaire / 26) x jours restants.",
        "Resultat net = conges payes (aucune deduction automatique pour demission).",
        "CDI: preavis par categorie et anciennete selon les regles actives.",
      ],
      warnings: dynamicWarnings.filter(Boolean),
      missingInformation,
      nextSteps: [
        "Verifier les jours de conges officiels avant remise de la demission.",
        "Formaliser la demission par ecrit avec preuve de reception.",
        "Obtenir le certificat de travail et le solde de tout compte signe.",
        input.noticeStatus === "not_served"
          ? "Servir le preavis ou negocier un accord pour eviter les litiges."
          : "",
        input.contractType === "CDD" ? "Qualifier le motif de rupture du CDD avant signature." : "",
      ].filter(Boolean),
    },
  };
}
