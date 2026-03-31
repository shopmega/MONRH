import { z } from "zod";
import { getTerminationRulesByDate } from "@/lib/rules/default-rules";

export const licenciementInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  contractType: z.enum(["CDI", "CDD"]).default("CDI"),
  workerCategory: z.enum(["cadre", "employe", "ouvrier"]).default("employe"),
  yearsOfService: z.number().min(0).max(60),
  monthsOfService: z.number().min(0).max(11).default(0),
  unusedLeaveDays: z.number().min(0).max(365).default(0),
  abusive: z.boolean().default(false),
});

export type LicenciementInput = z.infer<typeof licenciementInputSchema>;

export type LicenciementResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    contractType: "CDI" | "CDD";
    workerCategory: "cadre" | "employe" | "ouvrier";
    totalServiceYears: number;
    hourlySalary: number;
    indemnityLegale: number;
    indemnitePreavis: number;
    congesPayesRestants: number;
    dommagesAbusif: number;
    totalEstimated: number;
  };
  explanation: {
    summary: string;
    assumptions: string[];
    formulas: string[];
    warnings: string[];
    nextSteps: string[];
  };
};

function roundMAD(value: number) {
  return Math.round(value * 100) / 100;
}

function roundYears(value: number) {
  return Math.round(value * 1000) / 1000;
}

function noticeMonths(
  totalYears: number,
  rules: ReturnType<typeof getTerminationRulesByDate>,
  workerCategory: LicenciementInput["workerCategory"],
) {
  const categoryRules = rules.cdiNoticeMonthsByCategory[workerCategory];
  if (totalYears < 1) return categoryRules.lt1;
  if (totalYears < 5) return categoryRules.gte1lt5;
  return categoryRules.gte5;
}

function indemnityHours(totalYears: number, rules: ReturnType<typeof getTerminationRulesByDate>) {
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

export function simulateLicenciement(rawInput: LicenciementInput): LicenciementResult {
  const input = licenciementInputSchema.parse(rawInput);
  const rules = getTerminationRulesByDate(input.calculationDate);
  const totalServiceYears = input.yearsOfService + input.monthsOfService / 12;
  const hourlySalary = input.monthlySalary / 191;
  const legalHours = indemnityHours(totalServiceYears, rules);
  const legalIndemnityEligible = rules.legalIndemnityContractTypes.includes(input.contractType);
  const indemnityLegale = legalIndemnityEligible ? hourlySalary * legalHours : 0;
  const monthlyNotice = noticeMonths(totalServiceYears, rules, input.workerCategory);
  const cddNoticeDays = rules.cddNoticeDaysByCategory[input.workerCategory];
  const indemnitePreavis =
    input.contractType === "CDI"
      ? input.monthlySalary * monthlyNotice
      : (input.monthlySalary / 26) * cddNoticeDays;
  const congesPayesRestants = (input.monthlySalary / 26) * input.unusedLeaveDays;
  const abusiveMonths = Math.min(
    totalServiceYears * rules.abusiveBaseMonthsPerYear,
    rules.abusiveCapMonths,
  );
  const dommagesAbusif =
    input.abusive && input.contractType === "CDI" ? abusiveMonths * input.monthlySalary : 0;
  const totalEstimated =
    indemnityLegale + indemnitePreavis + congesPayesRestants + dommagesAbusif;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      contractType: input.contractType,
      workerCategory: input.workerCategory,
      totalServiceYears: roundYears(totalServiceYears),
      hourlySalary: roundMAD(hourlySalary),
      indemnityLegale: roundMAD(indemnityLegale),
      indemnitePreavis: roundMAD(indemnitePreavis),
      congesPayesRestants: roundMAD(congesPayesRestants),
      dommagesAbusif: roundMAD(dommagesAbusif),
      totalEstimated: roundMAD(totalEstimated),
    },
    explanation: {
      summary: `Montant total estime: ${roundMAD(totalEstimated)} MAD, incluant indemnites et conges restants.`,
      assumptions: [
        "Le salaire de reference utilise est le salaire mensuel saisi.",
        `Type de contrat: ${input.contractType}. Categorie: ${input.workerCategory}.`,
        "Le taux horaire est calcule sur une base de 191 heures mensuelles.",
        input.contractType === "CDD"
          ? "Le calcul CDD applique un preavis simplifie en jours selon la categorie."
          : "Le calcul CDI applique la duree de preavis selon anciennete et categorie.",
        input.abusive
          ? "Le scenario inclut une estimation des dommages pour licenciement abusif."
          : "Le scenario n'inclut pas de dommages pour licenciement abusif.",
      ],
      formulas: [
        "Indemnite legale = taux horaire x heures legalement dues selon anciennete.",
        input.contractType === "CDI"
          ? "Indemnite preavis (CDI) = salaire mensuel x duree de preavis estimee."
          : "Indemnite preavis (CDD) = salaire journalier x jours de preavis.",
        "Conges restants = (salaire mensuel / 26) x jours non pris.",
      ],
      warnings: [
        input.contractType === "CDD"
          ? "Pour la fin normale d'un CDD, utilisez aussi le simulateur Fin de CDD."
          : "Le calcul ne tient pas compte de clauses specifiques d'une convention collective.",
        "La classification cadre/employe/ouvrier doit correspondre au contrat et au bulletin.",
        "Les montants judiciaires eventuels peuvent varier selon preuve et procedure.",
      ],
      nextSteps: [
        "Verifier l'anciennete et les conges restants avec les documents RH.",
        "Utiliser un courrier de reclamation si le solde verse est inferieur a l'estimation.",
      ],
    },
  };
}
