import { z } from "zod";
import { getCurrentDateISO } from "@/lib/calculators/shared";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";

const directionSchema = z.enum(["gross_to_net", "net_to_gross"]);
const familySituationSchema = z.enum(["single", "married", "divorced", "widowed"]);

export const netGrossInputSchema = z.object({
  direction: directionSchema,
  amount: z.number().positive(),
  calculationDate: z.string().date().default(getCurrentDateISO),
  familySituation: familySituationSchema.default("single"),
  familyDependentsCount: z.number().min(0).max(6).default(0),
  additionalDeductionsAnnual: z.number().min(0).default(0),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(0.12).default(0.06),
});

export type NetGrossInput = z.input<typeof netGrossInputSchema>;
type ParsedNetGrossInput = z.infer<typeof netGrossInputSchema>;

type Breakdown = {
  gross: number;
  net: number;
  taxableIncome: number;
  cnssEmployee: number;
  cnssEmployer: number;
  amoEmployee: number;
  amoEmployer: number;
  cimrEmployee: number;
  familyTaxReduction: number;
  additionalDeductions: number;
  incomeTax: number;
  professionalExpenseDeduction: number;
  employerTotalCost: number;
};

type NetGrossExplanation = {
  summary: string;
  assumptions: string[];
  formulas: string[];
  warnings: string[];
  nextSteps: string[];
};

export type NetGrossResult = {
  versionId: string;
  versionCode: string;
  calculationDate: string;
  direction: NetGrossInput["direction"];
  inputAmount: number;
  breakdown: Breakdown;
  explanation: NetGrossExplanation;
};

function roundMAD(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeTax(taxableIncome: number, brackets: Array<{ min: number; max: number | null; rate: number }>) {
  let tax = 0;

  for (const bracket of brackets) {
    const start = bracket.min;
    const end = bracket.max ?? Number.POSITIVE_INFINITY;
    const slice = Math.max(Math.min(taxableIncome, end) - start, 0);
    tax += slice * bracket.rate;
  }

  return Math.max(0, tax);
}

function computeFamilyTaxReductionMonthly(input: ParsedNetGrossInput, rules: ReturnType<typeof getSalaryRulesByDate>) {
  const annualAmount = rules.familyChargeReductionAnnual ?? 0;
  const annualCap = rules.familyChargeReductionCapAnnual ?? 0;
  
  // Married taxpayers get additional reduction (equivalent to 1 dependent)
  const effectiveDependents = input.familyDependentsCount + (input.familySituation === "married" ? 1 : 0);
  
  return Math.min(effectiveDependents * annualAmount, annualCap) / 12;
}

function computeFromGross(
  gross: number,
  input: ParsedNetGrossInput,
): { breakdown: Breakdown } {
  const rules = getSalaryRulesByDate(input.calculationDate);
  const contributableBase = Math.min(gross, rules.cnssCeiling);
  const cnssEmployee = contributableBase * rules.cnssEmployeeRate;
  const cnssEmployer = contributableBase * rules.cnssEmployerRate;
  const amoEmployee = gross * rules.amoEmployeeRate;
  const amoEmployer = gross * rules.amoEmployerRate;
  const cimrEmployee = input.includeCimr ? gross * input.cimrRate : 0;
  const additionalDeductions = input.additionalDeductionsAnnual / 12;
  const professionalExpenseDeduction = Math.min(
    gross * rules.professionalExpenseRate,
    rules.professionalExpenseCap,
  );
  const taxableIncome = Math.max(
    0,
    gross - cnssEmployee - amoEmployee - professionalExpenseDeduction - additionalDeductions,
  );
  const familyTaxReduction = computeFamilyTaxReductionMonthly(input, rules);
  const incomeTax = Math.max(0, computeTax(taxableIncome, rules.taxBracketsMonthly) - familyTaxReduction);
  const net = gross - cnssEmployee - amoEmployee - cimrEmployee - incomeTax;
  const employerTotalCost = gross + cnssEmployer + amoEmployer;

  return {
    breakdown: {
      gross: roundMAD(gross),
      net: roundMAD(net),
      taxableIncome: roundMAD(taxableIncome),
      cnssEmployee: roundMAD(cnssEmployee),
      cnssEmployer: roundMAD(cnssEmployer),
      amoEmployee: roundMAD(amoEmployee),
      amoEmployer: roundMAD(amoEmployer),
      cimrEmployee: roundMAD(cimrEmployee),
      familyTaxReduction: roundMAD(familyTaxReduction),
      additionalDeductions: roundMAD(additionalDeductions),
      incomeTax: roundMAD(incomeTax),
      professionalExpenseDeduction: roundMAD(professionalExpenseDeduction),
      employerTotalCost: roundMAD(employerTotalCost),
    },
  };
}

export function simulateNetGross(rawInput: NetGrossInput): NetGrossResult {
  const input = netGrossInputSchema.parse(rawInput);
  const rules = getSalaryRulesByDate(input.calculationDate);

  if (input.direction === "gross_to_net") {
    const { breakdown } = computeFromGross(input.amount, input);
    return {
      versionId: rules.versionId,
      versionCode: rules.versionCode,
      calculationDate: input.calculationDate,
      direction: input.direction,
      inputAmount: roundMAD(input.amount),
      breakdown,
      explanation: {
        summary: `Pour un brut de ${roundMAD(input.amount)} MAD, le net estime est ${breakdown.net} MAD.`,
        assumptions: [
          "Calcul base sur les taux CNSS/AMO de la version legale selectionnee.",
          "Le plafonnement CNSS est applique sur la base contributive.",
          input.includeCimr ? `CIMR appliquee au taux ${roundMAD(input.cimrRate * 100)}%.` : "CIMR non incluse.",
          `Reduction IR charges de famille: ${roundMAD(breakdown.familyTaxReduction)} MAD/mois (${input.familyDependentsCount} personne(s) a charge${input.familySituation === "married" ? " + statut marital" : ""}).`,
          input.additionalDeductionsAnnual > 0
            ? `Deductions supplementaires: ${roundMAD(input.additionalDeductionsAnnual)} MAD/an.`
            : "Aucune deduction supplementaire declaree.",
        ],
        formulas: [
          "Net = Brut - CNSS salarie - AMO salarie - CIMR - IR.",
          "IR calcule par tranches sur le revenu imposable mensuel.",
          "Reduction charges de famille deduite du montant d'IR apres calcul par tranches.",
          "Cout employeur = Brut + CNSS employeur + AMO employeur.",
        ],
        warnings: [
          "Les retenues reelles peuvent varier selon convention interne ou avantages imposables.",
          "Les chiffres restent indicatifs et ne remplacent pas un bulletin officiel.",
        ],
        nextSteps: [
          "Comparer les resultats avec la fiche de paie du meme mois.",
          "Conserver la simulation avec sa version legale pour audit futur.",
        ],
      },
    };
  }

  // Binary search gross from a target net value.
  let low = input.amount;
  let high = input.amount * 2;
  let bestGross = high;

  for (let i = 0; i < 35; i += 1) {
    const mid = (low + high) / 2;
    const simulated = computeFromGross(mid, input);
    if (simulated.breakdown.net >= input.amount) {
      bestGross = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  const { breakdown } = computeFromGross(bestGross, input);
  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    calculationDate: input.calculationDate,
    direction: input.direction,
    inputAmount: roundMAD(input.amount),
    breakdown,
    explanation: {
      summary: `Pour viser ${roundMAD(input.amount)} MAD net, le brut estime est ${breakdown.gross} MAD.`,
      assumptions: [
        "Estimation calculee par recherche iterative a partir des taux en vigueur.",
        input.includeCimr ? `CIMR appliquee au taux ${roundMAD(input.cimrRate * 100)}%.` : "CIMR non incluse.",
        `Reduction IR charges de famille: ${roundMAD(breakdown.familyTaxReduction)} MAD/mois (${input.familyDependentsCount} personne(s) a charge${input.familySituation === "married" ? " + statut marital" : ""}).`,
      ],
      formulas: [
        "Recherche du brut tel que Net(brut) >= Net cible.",
        "Net(brut) suit la formule charges sociales + IR par tranches.",
        "Reduction charges de famille deduite du montant d'IR apres calcul par tranches.",
      ],
      warnings: [
        "Le resultat est une approximation mathematique du brut requis.",
        "Des primes ou avantages en nature peuvent modifier le brut reel necessaire.",
      ],
      nextSteps: [
        "Tester plusieurs scenarios (avec/sans CIMR).",
        "Valider le brut cible avec l'equipe paie/finance avant decision contractuelle.",
      ],
    },
  };
}
