import { z } from "zod";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const smigComplianceInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  salaryType: z.enum(["smig", "smag"]).default("smig"),
  /** Monthly base salary (base fixe, hors primes variables) */
  baseSalaryMad: z.number().positive(),
  /** Actual monthly working hours (default 191h for full-time) */
  actualMonthlyHours: z.number().min(1).max(300).default(191),
  /** Fixed monthly transport/meal allowance (may count toward SMIG in some rulings) */
  fixedAllowancesMad: z.number().min(0).default(0),
  /** Whether to include fixed allowances in compliance check */
  includeAllowancesInCheck: z.boolean().default(false),
});

export type SmigComplianceInput = z.infer<typeof smigComplianceInputSchema>;

export type SmigComplianceResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    salaryType: "smig" | "smag";
    smigHourlyRate: number;
    legalMinimumForActualHours: number;
    baseSalaryMad: number;
    effectiveSalaryForCheck: number;
    gapMad: number;
    compliant: boolean;
    partTimeNote?: string;
    proRataMinimum?: number;
  };
  explanation: CalculatorExplanation;
};

export function simulateSmigCompliance(rawInput: SmigComplianceInput): SmigComplianceResult {
  const input = smigComplianceInputSchema.parse(rawInput);
  const rules = getSmigRulesByDate(input.calculationDate);

  const isPartTime = input.actualMonthlyHours < rules.referenceHoursPerMonth;
  const effectiveSalaryForCheck = input.includeAllowancesInCheck
    ? input.baseSalaryMad + input.fixedAllowancesMad
    : input.baseSalaryMad;

  let legalMinimumForActualHours: number;
  let proRataMinimum: number | undefined;

  if (input.salaryType === "smig") {
    // SMIG is always proportional to hours actually worked
    legalMinimumForActualHours = roundMAD(rules.smigHourlyMad * input.actualMonthlyHours);
    if (isPartTime) {
      proRataMinimum = legalMinimumForActualHours;
    }
  } else {
    // SMAG: daily-based, reference 26 days/month. Pro-rate by days-equivalent.
    const equivalentDays = Math.min(input.actualMonthlyHours / (rules.referenceHoursPerMonth / rules.referenceDaysPerMonth), rules.referenceDaysPerMonth);
    legalMinimumForActualHours = roundMAD(rules.smagDailyMad * equivalentDays);
  }

  const gapMad = roundMAD(effectiveSalaryForCheck - legalMinimumForActualHours);

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      salaryType: input.salaryType,
      smigHourlyRate: input.salaryType === "smig" ? rules.smigHourlyMad : rules.smagDailyMad,
      legalMinimumForActualHours,
      baseSalaryMad: roundMAD(input.baseSalaryMad),
      effectiveSalaryForCheck: roundMAD(effectiveSalaryForCheck),
      gapMad,
      compliant: gapMad >= 0,
      ...(isPartTime ? { partTimeNote: `Temps partiel: minimum pro-rate sur ${input.actualMonthlyHours}h/mois.` } : {}),
      ...(proRataMinimum !== undefined ? { proRataMinimum } : {}),
    },
    explanation: {
      summary:
        gapMad >= 0
          ? `Salaire conforme: ${roundMAD(gapMad)} MAD au-dessus du minimum legal.`
          : `Non conforme: manque de ${roundMAD(Math.abs(gapMad))} MAD par rapport au minimum legal.`,
      assumptions: [
        `Type: ${input.salaryType.toUpperCase()} (${input.salaryType === "smig" ? `${rules.smigHourlyMad} MAD/h` : `${rules.smagDailyMad} MAD/j`}).`,
        `Heures mensuelles renseignees: ${input.actualMonthlyHours}h (reference legale: ${rules.referenceHoursPerMonth}h).`,
        isPartTime ? "Travailleur a temps partiel: minimum pro-rate selon heures reelles." : "Temps plein: base 191h/mois.",
        input.includeAllowancesInCheck
          ? `Primes fixes incluses dans le controle (${roundMAD(input.fixedAllowancesMad)} MAD).`
          : "Seul le salaire de base est inclus dans le controle (primes exclues).",
      ],
      formulas: [
        "SMIG minimum = taux horaire x heures mensuelles reelles.",
        "Ecart = salaire effectif controle - minimum legal pro-rate.",
      ],
      warnings: [
        "Les primes variables (hors contrat) ne compensent generalement pas un salaire de base inferieur au SMIG.",
        "Seules les primes contractuelles et fixes peuvent influencer le calcul selon jurisprudence.",
        gapMad < 0
          ? "Non-conformite: l'employeur s'expose a des sanctions inspection du travail et rappel de salaire."
          : "",
      ].filter(Boolean),
      nextSteps: [
        gapMad < 0
          ? "Préparer une reclamation ecrite avec bulletins et justificatif des heures reelles."
          : "Conserver cette simulation avec sa date et version legale.",
        "Verifier que le bulletin de paie mentionne les heures correctes.",
      ],
    },
  };
}
