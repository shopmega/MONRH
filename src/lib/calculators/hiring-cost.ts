import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const hiringCostInputSchema = z.object({
  offeredGross: z.number().positive(),
  calculationDate: z.string().date().default(getCurrentDateISO),
  companySize: z.enum(["small", "large"]).default("large"),
  // Recruitment costs
  recruitmentAgencyFeePercent: z.number().min(0).max(0.3).default(0), // % of annual salary
  jobBoardCost: z.number().min(0).default(0),
  // Onboarding
  onboardingMonths: z.number().int().min(0).max(6).default(1),
  onboardingProductivityPercent: z.number().min(0).max(1).default(0.5), // employee productive at 50% during onboarding
  // Equipment
  equipmentCost: z.number().min(0).default(0),
});

export type HiringCostInput = z.infer<typeof hiringCostInputSchema>;

export type HiringCostResult = {
  offeredGross: number;
  monthly: {
    baseEmployerCost: number;
    cnssEmployer: number;
    familyAllowanceEmployer: number;
    amoEmployer: number;
    formationPro: number;
  };
  annual: {
    totalSalaryCost: number;
    recruitmentFee: number;
    jobBoardCost: number;
    onboardingOpportunityCost: number;
    equipmentCost: number;
    totalFirstYearCost: number;
  };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateHiringCost(raw: HiringCostInput): HiringCostResult {
  const input = hiringCostInputSchema.parse(raw);
  const rules = getSalaryRulesByDate(input.calculationDate);

  const contributableBase = Math.min(input.offeredGross, rules.cnssCeiling);
  const cnssEmployer = roundMAD(contributableBase * rules.cnssEmployerRate);
  const familyAllowanceEmployer = roundMAD(input.offeredGross * rules.familyAllowanceEmployerRate);
  const amoEmployer = roundMAD(input.offeredGross * rules.amoEmployerRate);
  const formationProRate = input.companySize === "small" ? rules.formationProRateSmall : rules.formationProRateLarge;
  const formationPro = roundMAD(input.offeredGross * formationProRate);
  const baseEmployerCost = roundMAD(
    input.offeredGross + cnssEmployer + familyAllowanceEmployer + amoEmployer + formationPro,
  );

  const totalSalaryCost = roundMAD(baseEmployerCost * 12);
  const recruitmentFee = roundMAD((input.offeredGross * 12) * input.recruitmentAgencyFeePercent);
  const onboardingOpportunityCost = roundMAD(
    baseEmployerCost * input.onboardingMonths * (1 - input.onboardingProductivityPercent),
  );
  const totalFirstYearCost = roundMAD(
    totalSalaryCost + recruitmentFee + input.jobBoardCost + onboardingOpportunityCost + input.equipmentCost,
  );

  return {
    offeredGross: roundMAD(input.offeredGross),
    monthly: { baseEmployerCost, cnssEmployer, familyAllowanceEmployer, amoEmployer, formationPro },
    annual: {
      totalSalaryCost,
      recruitmentFee,
      jobBoardCost: roundMAD(input.jobBoardCost),
      onboardingOpportunityCost,
      equipmentCost: roundMAD(input.equipmentCost),
      totalFirstYearCost,
    },
    explanation: {
      summary: `Un recrutement a ${input.offeredGross} MAD brut/mois coute ${totalFirstYearCost} MAD la premiere annee (salaire + recrutement + onboarding + equipement).`,
      warnings: [
        `Le cout mensuel employeur est de ${baseEmployerCost} MAD (${roundMAD(((baseEmployerCost - input.offeredGross) / input.offeredGross) * 100)}% de charges au-dessus du brut).`,
        recruitmentFee > 0 ? `Les frais de cabinet representent ${recruitmentFee} MAD.` : "",
      ].filter(Boolean) as string[],
      nextSteps: [
        "Comparez ce cout avec le cout d'une internalisation (vs prestataire externe).",
        "Anticipez le budget equipement et onboarding dans votre planification RH.",
        "Generez une fiche budgetaire de recrutement pour validation direction.",
      ],
    },
  };
}
