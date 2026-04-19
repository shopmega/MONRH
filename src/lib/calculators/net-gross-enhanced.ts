import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import { getCurrentDateISO, type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const netGrossEnhancedInputSchema = z.object({
  calculationDate: z.string().date().default(getCurrentDateISO),
  direction: z.enum(["gross_to_net", "net_to_gross"]).default("gross_to_net"),
  amount: z.number().positive(),
  familySituation: z.enum(["single", "married", "married_with_children", "divorced", "widowed"]).default("single"),
  dependentChildren: z.number().min(0).max(10).default(0),
  disabledChildren: z.number().min(0).max(10).default(0),
  elderlyDependents: z.number().min(0).max(5).default(0),
  transportAllowance: z.number().min(0).default(0),
  accommodationAllowance: z.number().min(0).default(0),
  benefitsInNature: z.enum(["none", "housing", "vehicle", "meals", "mixed"]).default("none"),
  benefitsInNatureAmount: z.number().min(0).default(0),
  regionCode: z.enum(["national", "grand_casablanca", "rabat_sale", "oriental", "marrakech_safi", "souss_massa"]).default("national"),
  professionalExpensesOption: z.enum(["standard", "actual"]).default("standard"),
  actualProfessionalExpenses: z.number().min(0).default(0),
  includeCimr: z.boolean().default(false),
  cimrRate: z.number().min(0).max(20).step(0.1).default(6),
});

export type NetGrossEnhancedInput = z.infer<typeof netGrossEnhancedInputSchema>;

export type NetGrossEnhancedResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    grossSalary: number;
    netSalary: number;
    cnssEmployee: number;
    cnssEmployer: number;
    amoEmployee: number;
    amoEmployer: number;
    professionalDeduction: number;
    taxableIncome: number;
    incomeTax: number;
    cimrEmployee: number;
    employerTotalCost: number;
    effectiveTaxRate: number;
    netToGrossRatio: number;
  };
  explanation: CalculatorExplanation;
};

// Regional tax adjustments
const REGIONAL_ADJUSTMENTS: Record<string, { taxRateAdjustment: number; allowanceAdjustment: number }> = {
  national: { taxRateAdjustment: 0, allowanceAdjustment: 0 },
  grand_casablanca: { taxRateAdjustment: -0.05, allowanceAdjustment: 200 },
  rabat_sale: { taxRateAdjustment: -0.03, allowanceAdjustment: 150 },
  oriental: { taxRateAdjustment: -0.02, allowanceAdjustment: 100 },
  marrakech_safi: { taxRateAdjustment: -0.04, allowanceAdjustment: 180 },
  souss_massa: { taxRateAdjustment: -0.01, allowanceAdjustment: 120 },
};

// Family situation tax benefits
const FAMILY_BENEFITS: Record<string, { baseDeduction: number; childDeduction: number; maxChildren: number }> = {
  single: { baseDeduction: 0, childDeduction: 0, maxChildren: 0 },
  married: { baseDeduction: 30, childDeduction: 0, maxChildren: 0 },
  married_with_children: { baseDeduction: 30, childDeduction: 36, maxChildren: 6 },
  divorced: { baseDeduction: 15, childDeduction: 0, maxChildren: 0 },
  widowed: { baseDeduction: 30, childDeduction: 36, maxChildren: 6 },
};

function calculateProgressiveTax(
  taxableIncome: number,
  annualBrackets: Array<{ min: number; max: number | null; rate: number }>,
  regionAdjustment: number = 0,
  familyBenefit: number = 0
): number {
  let tax = 0;
  const adjustedTaxableIncome = Math.max(0, taxableIncome - familyBenefit);
  
  for (const bracket of annualBrackets) {
    const start = bracket.min * 12; // Convert monthly to annual
    const end = bracket.max ? bracket.max * 12 : Number.POSITIVE_INFINITY;
    const slice = Math.max(Math.min(adjustedTaxableIncome * 12, end) - start, 0);
    tax += slice * (bracket.rate + regionAdjustment);
  }
  
  return Math.max(0, tax / 12); // Return monthly tax
}

function calculateProfessionalDeduction(
  option: string,
  actualExpenses: number,
  grossSalary: number,
  rules: any
): { deduction: number; explanation: string } {
  if (option === "actual") {
    const maxDeduction = Math.min(actualExpenses, grossSalary * rules.professionalExpenseRate);
    return {
      deduction: maxDeduction,
      explanation: `Déduction réelle: ${actualExpenses} MAD (plafonnée à ${maxDeduction.toFixed(2)} MAD)`
    };
  } else {
    const standardDeduction = Math.min(grossSalary * rules.professionalExpenseRate, rules.professionalExpenseCap);
    return {
      deduction: standardDeduction,
      explanation: `Déduction standard: ${standardDeduction.toFixed(2)} MAD (${(rules.professionalExpenseRate * 100)}% du salaire)`
    };
  }
}

function calculateBenefitsInNature(
  type: string,
  amount: number,
  grossSalary: number
): { value: number; taxablePortion: number; explanation: string } {
  if (type === "none") {
    return { value: 0, taxablePortion: 0, explanation: "Aucun avantage en nature" };
  }
  
  // Generally, benefits in nature are considered taxable up to 20% of gross salary
  const maxTaxable = grossSalary * 0.2;
  const taxablePortion = Math.min(amount, maxTaxable);
  
  const explanations: Record<string, string> = {
    housing: "Avantage logement (taxable à concurrence de 20% du salaire)",
    vehicle: "Avantage véhicule (taxable à concurrence de 20% du salaire)",
    meals: "Avantage repas (taxable à concurrence de 20% du salaire)",
    mixed: "Avantages mixtes (taxable à concurrence de 20% du salaire)"
  };
  
  return {
    value: amount,
    taxablePortion,
    explanation: explanations[type] || "Avantage en nature"
  };
}

export function simulateNetGrossEnhanced(
  rawInput: NetGrossEnhancedInput
): NetGrossEnhancedResult {
  const input = netGrossEnhancedInputSchema.parse(rawInput);
  const rules = getSalaryRulesByDate(input.calculationDate);
  
  // Calculate gross salary (for net-to-gross direction)
  let grossSalary = input.direction === "net_to_gross" ? input.amount : 0;
  let netSalary = input.direction === "gross_to_net" ? input.amount : 0;
  
  // For net-to-gross, we need to iterate to find the gross amount
  if (input.direction === "net_to_gross") {
    let low = input.amount;
    let high = input.amount * 2; // Start with reasonable upper bound
    
    for (let i = 0; i < 50; i++) { // Max 50 iterations
      const mid = (low + high) / 2;
      const testResult = simulateGrossToNet(mid, input, rules);
      
      if (Math.abs(testResult.netSalary - input.amount) < 0.01) {
        grossSalary = mid;
        netSalary = testResult.netSalary;
        break;
      }
      
      if (testResult.netSalary < input.amount) {
        low = mid;
      } else {
        high = mid;
      }
    }
  } else {
    // For gross-to-net, direct calculation
    const result = simulateGrossToNet(input.amount, input, rules);
    grossSalary = result.grossSalary;
    netSalary = result.netSalary;
  }
  
  const cnssEmployee = Math.min(grossSalary * rules.cnssEmployeeRate, rules.cnssCeiling);
  const cnssEmployer = Math.min(grossSalary * rules.cnssEmployerRate, rules.cnssCeiling);
  const amoEmployee = grossSalary * rules.amoEmployeeRate;
  const amoEmployer = grossSalary * rules.amoEmployerRate;
  
  // Professional expenses
  const professionalResult = calculateProfessionalDeduction(
    input.professionalExpensesOption,
    input.actualProfessionalExpenses,
    grossSalary,
    rules
  );
  const professionalDeduction = professionalResult.deduction;
  
  // Benefits in nature
  const benefitsResult = calculateBenefitsInNature(
    input.benefitsInNature,
    input.benefitsInNatureAmount,
    grossSalary
  );
  
  // Family benefits calculation
  const familyBenefits = FAMILY_BENEFITS[input.familySituation];
  const childDeduction = Math.min(
    input.dependentChildren * familyBenefits.childDeduction,
    familyBenefits.maxChildren * familyBenefits.childDeduction
  );
  const totalFamilyDeduction = familyBenefits.baseDeduction + childDeduction;
  
  // Regional adjustments
  const regionalAdjustment = REGIONAL_ADJUSTMENTS[input.regionCode];
  
  // Calculate taxable income
  const taxableIncome = grossSalary 
    - cnssEmployee 
    - amoEmployee 
    - professionalDeduction 
    - benefitsResult.taxablePortion
    - totalFamilyDeduction
    + (input.transportAllowance + input.accommodationAllowance); // Allowances are added back
  
  // Calculate income tax
  const incomeTax = calculateProgressiveTax(
    taxableIncome,
    rules.taxBracketsMonthly,
    regionalAdjustment.taxRateAdjustment,
    totalFamilyDeduction
  );
  
  // CIMR calculation
  const cimrEmployee = input.includeCimr ? grossSalary * (input.cimrRate / 100) : 0;
  
  // Total employer cost
  const employerTotalCost = grossSalary + cnssEmployer + amoEmployer + cimrEmployee;
  
  // Effective tax rate
  const effectiveTaxRate = grossSalary > 0 ? (incomeTax / grossSalary) * 100 : 0;
  
  // Net to gross ratio
  const netToGrossRatio = grossSalary > 0 ? (netSalary / grossSalary) * 100 : 0;
  
  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      grossSalary: roundMAD(grossSalary),
      netSalary: roundMAD(netSalary),
      cnssEmployee: roundMAD(cnssEmployee),
      cnssEmployer: roundMAD(cnssEmployer),
      amoEmployee: roundMAD(amoEmployee),
      amoEmployer: roundMAD(amoEmployer),
      professionalDeduction: roundMAD(professionalDeduction),
      taxableIncome: roundMAD(taxableIncome),
      incomeTax: roundMAD(incomeTax),
      cimrEmployee: roundMAD(cimrEmployee),
      employerTotalCost: roundMAD(employerTotalCost),
      effectiveTaxRate: roundMAD(effectiveTaxRate),
      netToGrossRatio: roundMAD(netToGrossRatio),
    },
    explanation: {
      summary: `Calcul ${input.direction === "gross_to_net" ? "brut vers net" : "net vers brut"} avec situation familiale et avantages légaux.`,
      assumptions: [
        `Situation familiale: ${input.familySituation}`,
        `Enfants à charge: ${input.dependentChildren}`,
        `Enfants handicapés: ${input.disabledChildren}`,
        `Personnes âgées à charge: ${input.elderlyDependents}`,
        `Région: ${input.regionCode}`,
        professionalResult.explanation,
        benefitsResult.explanation,
        `Indemnité transport: ${input.transportAllowance} MAD/mois`,
        `Indemnité logement: ${input.accommodationAllowance} MAD/mois`,
        input.includeCimr ? `CIMR: ${input.cimrRate}%` : "Pas de CIMR"
      ],
      formulas: [
        "Salaire Net = Salaire Brut - CNSS - AMO - Frais Pro - IR",
        "Frais Professionnels = MIN(20% du salaire, plafond) OU frais réels",
        "IR = Calcul progressif par tranches avec ajustements régionaux et familiaux",
        "Coût Employeur = Salaire Brut + CNSS Employeur + AMO Employeur + CIMR"
      ],
      warnings: [
        "Les avantages en nature sont imposables jusqu'à 20% du salaire brut",
        "Les taux régionaux peuvent varier selon la législation en vigueur",
        "Vérifiez les barèmes fiscaux applicables à votre région"
      ],
      nextSteps: [
        "Consulter un expert-comptable pour optimisation fiscale",
        "Vérifier les déductions autorisées pour votre situation",
        "Considérer les avantages en nature dans votre négociation salariale",
        "Garder les justificatifs de frais professionnels"
      ]
    }
  };
}

// Helper function for gross-to-net calculation
function simulateGrossToNet(
  grossAmount: number,
  input: NetGrossEnhancedInput,
  rules: any
): { grossSalary: number; netSalary: number } {
  const cnssEmployee = Math.min(grossAmount * rules.cnssEmployeeRate, rules.cnssCeiling);
  const amoEmployee = grossAmount * rules.amoEmployeeRate;
  
  // Professional expenses
  const professionalResult = calculateProfessionalDeduction(
    input.professionalExpensesOption,
    input.actualProfessionalExpenses,
    grossAmount,
    rules
  );
  const professionalDeduction = professionalResult.deduction;
  
  // Benefits in nature
  const benefitsResult = calculateBenefitsInNature(
    input.benefitsInNature,
    input.benefitsInNatureAmount,
    grossAmount
  );
  
  // Family benefits
  const familyBenefits = FAMILY_BENEFITS[input.familySituation];
  const childDeduction = Math.min(
    input.dependentChildren * familyBenefits.childDeduction,
    familyBenefits.maxChildren * familyBenefits.childDeduction
  );
  const totalFamilyDeduction = familyBenefits.baseDeduction + childDeduction;
  
  // Regional adjustments
  const regionalAdjustment = REGIONAL_ADJUSTMENTS[input.regionCode];
  
  // Calculate taxable income
  const taxableIncome = grossAmount 
    - cnssEmployee 
    - amoEmployee 
    - professionalDeduction 
    - benefitsResult.taxablePortion
    - totalFamilyDeduction
    + (input.transportAllowance + input.accommodationAllowance);
  
  // Calculate income tax
  const incomeTax = calculateProgressiveTax(
    taxableIncome,
    rules.taxBracketsMonthly,
    regionalAdjustment.taxRateAdjustment,
    totalFamilyDeduction
  );
  
  // CIMR
  const cimrEmployee = input.includeCimr ? grossAmount * (input.cimrRate / 100) : 0;
  
  const netSalary = grossAmount - cnssEmployee - amoEmployee - incomeTax - cimrEmployee;
  
  return {
    grossSalary: grossAmount,
    netSalary: netSalary
  };
}
