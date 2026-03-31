import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

function computeTax(
  taxableIncome: number,
  brackets: Array<{ min: number; max: number | null; rate: number }>,
): number {
  let tax = 0;
  for (const b of brackets) {
    const end = b.max ?? Infinity;
    const slice = Math.max(Math.min(taxableIncome, end) - b.min, 0);
    tax += slice * b.rate;
  }
  return Math.max(0, tax);
}

function calcSalaryNet(gross: number, calculationDate: string): { net: number; employerCost: number } {
  const rules = getSalaryRulesByDate(calculationDate);
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployee = contributableBase * rules.cnssEmployeeRate;
  const cnssEmployer = contributableBase * rules.cnssEmployerRate;
  const amoEmployee = gross * rules.amoEmployeeRate;
  const amoEmployer = gross * rules.amoEmployerRate;
  const professionalExpenseDeduction = Math.min(
    gross * rules.professionalExpenseRate,
    rules.professionalExpenseCap,
  );
  const taxableIncome = Math.max(0, gross - cnssEmployee - amoEmployee - professionalExpenseDeduction);
  const incomeTax = computeTax(taxableIncome, rules.taxBracketsMonthly);
  const net = gross - cnssEmployee - amoEmployee - incomeTax;
  const employerCost = gross + cnssEmployer + amoEmployer;
  return { net: roundMAD(net), employerCost: roundMAD(employerCost) };
}

// Auto-entrepreneur rates (Morocco 2025)
const AE_RATES = {
  services: 0.02,   // 2% on revenue (services + liberal professions)
  trade: 0.01,      // 1% on revenue (trading activities)
};

function calcFreelanceNet(
  monthlyRevenue: number,
  activityType: "services" | "trade",
  voluntaryCnssMonthly: number,
): { net: number; tax: number; cnss: number; totalDeductions: number } {
  const taxRate = AE_RATES[activityType];
  const tax = monthlyRevenue * taxRate;
  const cnss = voluntaryCnssMonthly;
  const net = monthlyRevenue - tax - cnss;
  return {
    net: roundMAD(net),
    tax: roundMAD(tax),
    cnss: roundMAD(cnss),
    totalDeductions: roundMAD(tax + cnss),
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const freelanceVsSalaryInputSchema = z.object({
  salaryGross: z.number().positive(),
  freelanceMonthlyRevenue: z.number().positive(),
  activityType: z.enum(["services", "trade"]).default("services"),
  voluntaryCnssMonthly: z.number().min(0).default(0),
  calculationDate: z.string().date().default("2026-01-01"),
  // Opportunity cost factors
  paidVacationDaysPerYear: z.number().min(0).max(60).default(18),
  workingMonthsPerYear: z.number().min(1).max(12).default(11),
});

export type FreelanceVsSalaryInput = z.infer<typeof freelanceVsSalaryInputSchema>;

export type FreelanceVsSalaryResult = {
  calculationDate: string;
  salaried: {
    gross: number;
    net: number;
    employerCost: number;
    annualNet: number;
    hiddenBenefitsValue: number; // paid leave + CNSS protections estimate
  };
  freelance: {
    monthlyRevenue: number;
    activityType: "services" | "trade";
    taxRate: number;
    net: number;
    tax: number;
    cnss: number;
    annualNet: number;
    workingMonths: number;
  };
  comparison: {
    monthlyNetDelta: number;
    annualNetDelta: number;
    breakEvenRevenue: number; // freelance revenue needed to match salary net
    freelanceAdvantage: boolean;
    stabilityGapMonthly: number;
  };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateFreelanceVsSalary(raw: FreelanceVsSalaryInput): FreelanceVsSalaryResult {
  const input = freelanceVsSalaryInputSchema.parse(raw);

  const salary = calcSalaryNet(input.salaryGross, input.calculationDate);
  const freelance = calcFreelanceNet(
    input.freelanceMonthlyRevenue,
    input.activityType,
    input.voluntaryCnssMonthly,
  );

  // Hidden benefit value: paid leave (salary / 12 months * leave days value) + rough CNSS protection estimate
  const dailyNetSalary = salary.net / 22;
  const hiddenBenefitsValue = roundMAD(dailyNetSalary * (input.paidVacationDaysPerYear / 12) + 400); // 400 MAD/mo CNSS protection estimate

  const annualSalaryNet = roundMAD(salary.net * 12);
  const annualFreelanceNet = roundMAD(freelance.net * input.workingMonthsPerYear);

  // Break-even: freelance monthly revenue where net == salary net
  const taxRate = AE_RATES[input.activityType];
  const breakEvenRevenue = roundMAD((salary.net + input.voluntaryCnssMonthly) / (1 - taxRate));

  const monthlyNetDelta = roundMAD(freelance.net - salary.net);
  const annualNetDelta = roundMAD(annualFreelanceNet - annualSalaryNet);
  const stabilityGapMonthly = roundMAD(hiddenBenefitsValue);

  return {
    calculationDate: input.calculationDate,
    salaried: {
      gross: roundMAD(input.salaryGross),
      net: salary.net,
      employerCost: salary.employerCost,
      annualNet: annualSalaryNet,
      hiddenBenefitsValue,
    },
    freelance: {
      monthlyRevenue: roundMAD(input.freelanceMonthlyRevenue),
      activityType: input.activityType,
      taxRate: taxRate * 100,
      net: freelance.net,
      tax: freelance.tax,
      cnss: freelance.cnss,
      annualNet: annualFreelanceNet,
      workingMonths: input.workingMonthsPerYear,
    },
    comparison: {
      monthlyNetDelta,
      annualNetDelta,
      breakEvenRevenue,
      freelanceAdvantage: monthlyNetDelta > 0,
      stabilityGapMonthly,
    },
    explanation: {
      summary:
        monthlyNetDelta > 0
          ? `En freelance a ${input.freelanceMonthlyRevenue} MAD/mois, vous gagnez ${monthlyNetDelta} MAD net de plus que votre salarie actuel.`
          : `Votre salarie actuel vous rapporte ${Math.abs(monthlyNetDelta)} MAD net de plus que le freelance a ${input.freelanceMonthlyRevenue} MAD/mois.`,
      warnings: [
        `Le seuil de revenus pour egaler votre salarie net est de ${breakEvenRevenue} MAD/mois.`,
        `Le salarie inclut ~${hiddenBenefitsValue} MAD/mois en avantages caches (conges, protection CNSS).`,
        input.voluntaryCnssMonthly === 0
          ? "Sans cotisation CNSS volontaire, vous perdez toute protection sociale (maladie, retraite)."
          : `Vous cotisez ${input.voluntaryCnssMonthly} MAD/mois en CNSS, ce qui reduit votre filet de securite.`,
      ],
      nextSteps: [
        `Generez une fiche de tarification freelance basee sur votre seuil de ${breakEvenRevenue} MAD/mois.`,
        "Calculez votre TJM (tarif journalier moyen) si vous facturez a la journee.",
        "Envisagez une transition progressive (CDI + micro-mission) avant de basculer totalement.",
      ],
    },
  };
}
