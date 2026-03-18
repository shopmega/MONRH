import { z } from "zod";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const freelancePricingInputSchema = z.object({
  targetMonthlyNet: z.number().positive(),
  activityType: z.enum(["trade", "services", "liberal"]).default("services"),
  voluntaryCnssMonthly: z.number().min(0).default(0),
  monthlyExpenses: z.number().min(0).default(0),
  // Working calendar
  billedDaysPerMonth: z.number().min(1).max(31).default(18),
  vacationWeeksPerYear: z.number().min(0).max(12).default(5),
  sickDaysPerYear: z.number().min(0).max(30).default(5),
});

export type FreelancePricingInput = z.infer<typeof freelancePricingInputSchema>;

export type FreelancePricingResult = {
  targetMonthlyNet: number;
  activityType: string;
  // AE tax rate to apply
  taxRate: number;
  // Required revenue to hit target net
  requiredMonthlyRevenue: number;
  requiredAnnualRevenue: number;
  // Derived day rates
  tjmRequired: number; // tarif journalier moyen
  tjmWithBuffer: number; // +20% safety buffer
  // Breakdown
  monthlyTax: number;
  monthlyCnss: number;
  monthlyExpenses: number;
  netBilledDaysPerYear: number;
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateFreelancePricing(raw: FreelancePricingInput): FreelancePricingResult {
  const input = freelancePricingInputSchema.parse(raw);
  const AE_RATES: Record<string, number> = { trade: 0.01, services: 0.02, liberal: 0.02 };
  const taxRate = AE_RATES[input.activityType];

  // Required revenue: net + tax + cnss + expenses
  // net = revenue * (1 - taxRate) - cnss - expenses
  // => revenue = (net + cnss + expenses) / (1 - taxRate)
  const requiredMonthlyRevenue = roundMAD(
    (input.targetMonthlyNet + input.voluntaryCnssMonthly + input.monthlyExpenses) / (1 - taxRate),
  );

  const monthlyTax = roundMAD(requiredMonthlyRevenue * taxRate);
  const requiredAnnualRevenue = roundMAD(requiredMonthlyRevenue * 12);

  // Net billed days: subtract vacation and sick days from 12 months
  const totalWorkingDays = input.billedDaysPerMonth * 12;
  const vacationDays = input.vacationWeeksPerYear * 5;
  const netBilledDaysPerYear = Math.max(1, totalWorkingDays - vacationDays - input.sickDaysPerYear);

  // TJM = annual revenue / net billed days
  const tjmRequired = roundMAD(requiredAnnualRevenue / netBilledDaysPerYear);
  const tjmWithBuffer = roundMAD(tjmRequired * 1.2);

  return {
    targetMonthlyNet: roundMAD(input.targetMonthlyNet),
    activityType: input.activityType,
    taxRate: taxRate * 100,
    requiredMonthlyRevenue,
    requiredAnnualRevenue,
    tjmRequired,
    tjmWithBuffer,
    monthlyTax,
    monthlyCnss: roundMAD(input.voluntaryCnssMonthly),
    monthlyExpenses: roundMAD(input.monthlyExpenses),
    netBilledDaysPerYear,
    explanation: {
      summary: `Pour ${input.targetMonthlyNet} MAD net/mois, vous devez facturer ${requiredMonthlyRevenue} MAD/mois — soit un TJM de ${tjmRequired} MAD.`,
      warnings: [
        `Le TJM recommande inclut une marge de securite de 20% (${tjmWithBuffer} MAD/jour).`,
        `Votre CA annuel requis (${requiredAnnualRevenue} MAD) doit rester sous les plafonds AE.`,
        netBilledDaysPerYear < 180
          ? "Attention: peu de jours facturables. Assurez un carnet de commandes solide."
          : "",
      ].filter(Boolean) as string[],
      nextSteps: [
        `Definissez votre TJM a ${tjmRequired} MAD minimum, idealement ${tjmWithBuffer} MAD.`,
        "Calculez votre taux horaire si vous facturez au temps passe (TJM / 8 heures).",
        "Testez ce tarif sur le marche avant de quitter votre emploi actuel.",
      ],
    },
  };
}
