import { z } from "zod";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const profitExpenseInputSchema = z.object({
  monthlyRevenue: z.number().positive(),
  expenses: z.array(
    z.object({
      label: z.string().max(80),
      amount: z.number().min(0),
      category: z.enum(["software", "equipment", "office", "transport", "marketing", "subcontracting", "other"]).default("other"),
    }),
  ).default([]),
  taxRate: z.number().min(0).max(0.5).default(0.02), // AE or custom
  cnssMonthly: z.number().min(0).default(0),
});

export type ProfitExpenseInput = z.infer<typeof profitExpenseInputSchema>;

export type ExpenseLine = {
  label: string;
  amount: number;
  category: string;
  percentOfRevenue: number;
};

export type ProfitExpenseResult = {
  monthlyRevenue: number;
  totalExpenses: number;
  tax: number;
  cnss: number;
  grossProfit: number;
  netProfit: number;
  netMargin: number;
  expenseLines: ExpenseLine[];
  expensesByCategory: Record<string, number>;
  annualProjection: { revenue: number; netProfit: number };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateProfitExpense(raw: ProfitExpenseInput): ProfitExpenseResult {
  const input = profitExpenseInputSchema.parse(raw);

  const tax = roundMAD(input.monthlyRevenue * input.taxRate);
  const totalExpenses = roundMAD(input.expenses.reduce((s, e) => s + e.amount, 0));
  const grossProfit = roundMAD(input.monthlyRevenue - totalExpenses);
  const netProfit = roundMAD(grossProfit - tax - input.cnssMonthly);
  const netMargin = roundMAD((netProfit / input.monthlyRevenue) * 100);

  const expenseLines: ExpenseLine[] = input.expenses.map((e) => ({
    label: e.label,
    amount: roundMAD(e.amount),
    category: e.category,
    percentOfRevenue: roundMAD((e.amount / input.monthlyRevenue) * 100),
  }));

  const expensesByCategory: Record<string, number> = {};
  for (const e of input.expenses) {
    expensesByCategory[e.category] = roundMAD((expensesByCategory[e.category] ?? 0) + e.amount);
  }

  return {
    monthlyRevenue: roundMAD(input.monthlyRevenue),
    totalExpenses,
    tax,
    cnss: roundMAD(input.cnssMonthly),
    grossProfit,
    netProfit,
    netMargin,
    expenseLines,
    expensesByCategory,
    annualProjection: {
      revenue: roundMAD(input.monthlyRevenue * 12),
      netProfit: roundMAD(netProfit * 12),
    },
    explanation: {
      summary: `Revenu: ${input.monthlyRevenue} MAD → benefice net: ${netProfit} MAD/mois (marge ${netMargin}%).`,
      warnings: [
        grossProfit < 0 ? "Atention: vos charges depassent vos revenus. Revue urgente necessaire." : "",
        netMargin < 20
          ? "Marge nette inferieure a 20%: evaluez les charges les plus importantes a reduire."
          : "",
      ].filter(Boolean) as string[],
      nextSteps: [
        "Identifiez les postes de depenses les plus importants a optimiser.",
        "Comparez votre marge avec les benchmarks de votre secteur.",
        "Generez un rapport de rentabilite pour vos clients ou partenaires.",
      ],
    },
  };
}
