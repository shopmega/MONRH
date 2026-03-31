import { z } from "zod";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// Morocco Auto-Entrepreneur rates (Loi 114-13 and finance laws)
const AE_TAX_RATES: Record<string, number> = {
  trade: 0.01,          // Activites commerciales / artisanales
  services: 0.02,       // Prestations de services
  liberal: 0.02,        // Professions liberales
};

// ─── Schema ───────────────────────────────────────────────────────────────────

export const autoEntrepreneurInputSchema = z.object({
  monthlyRevenue: z.number().positive(),
  activityType: z.enum(["trade", "services", "liberal"]).default("services"),
  voluntaryCnssMonthly: z.number().min(0).default(0),
  monthlyExpenses: z.number().min(0).default(0), // professional expenses
});

export type AutoEntrepreneurInput = z.infer<typeof autoEntrepreneurInputSchema>;

export type AutoEntrepreneurResult = {
  monthlyRevenue: number;
  activityType: string;
  taxRate: number;
  tax: number;
  cnss: number;
  expenses: number;
  netIncome: number;
  profitMargin: number;
  annualProjection: {
    revenue: number;
    tax: number;
    net: number;
  };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateAutoEntrepreneur(raw: AutoEntrepreneurInput): AutoEntrepreneurResult {
  const input = autoEntrepreneurInputSchema.parse(raw);
  const taxRate = AE_TAX_RATES[input.activityType];

  const tax = roundMAD(input.monthlyRevenue * taxRate);
  const cnss = roundMAD(input.voluntaryCnssMonthly);
  const netIncome = roundMAD(input.monthlyRevenue - tax - cnss - input.monthlyExpenses);
  const profitMargin = roundMAD((netIncome / input.monthlyRevenue) * 100);

  return {
    monthlyRevenue: roundMAD(input.monthlyRevenue),
    activityType: input.activityType,
    taxRate: taxRate * 100,
    tax,
    cnss,
    expenses: roundMAD(input.monthlyExpenses),
    netIncome,
    profitMargin,
    annualProjection: {
      revenue: roundMAD(input.monthlyRevenue * 12),
      tax: roundMAD(tax * 12),
      net: roundMAD(netIncome * 12),
    },
    explanation: {
      summary: `Sur ${input.monthlyRevenue} MAD de CA, vous conservez ${netIncome} MAD net/mois (marge ${profitMargin}%).`,
      warnings: [
        `Taux applique: ${taxRate * 100}% sur le CA brut (activite: ${input.activityType}).`,
        "Le regime AE est limite: chiffre d'affaires maximum annuel de 500 000 MAD (services) ou 2 000 000 MAD (commerce).",
        input.voluntaryCnssMonthly === 0
          ? "Sans cotisation CNSS volontaire, vous ne beneficiez d'aucune couverture sociale."
          : `Vous cotisez ${cnss} MAD/mois en CNSS volontaire.`,
      ],
      nextSteps: [
        "Verifiez que votre CA previsionnel reste sous le plafond AE.",
        "Faites votre declaration mensuelle ou trimestrielle en ligne via le portail AE.",
        "Comparez ce net avec ou sans CNSS volontaire pour arbitrer votre couverture sociale.",
      ],
    },
  };
}
