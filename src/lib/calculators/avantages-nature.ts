import { z } from "zod";

function roundMAD(v: number) {
  return Math.round(v * 100) / 100;
}

// ─── DGI taxable values for benefits in kind (Morocco) ─────────────────────

/**
 * Moroccan DGI rules for avantages en nature:
 * - Vehicle: 5000 MAD/month taxable allowance per company car (flat estimate for simulator)
 * - Housing: market value or at least 15% of gross salary
 * - Meals: actual value of meal vouchers / canteen subsidy
 * - Phone: 50% of subscription/bill
 * - Transport: value exceeding 600 MAD/month is taxable
 */
const DGI_DEFAULTS = {
  vehicleMonthlyTaxable: 5000,     // per vehicle, rough DGI estimate
  housingMinSalaryRatio: 0.15,      // at least 15% of gross
  mealTaxableRatio: 1.0,            // full value of meal vouchers if above market
  phoneTaxableRatio: 0.5,           // 50% of phone benefit
  transportExemptCap: 600,          // MAD/month exempt
};

// ─── Schema ───────────────────────────────────────────────────────────────────

export const avantagesNatureInputSchema = z.object({
  grossSalary: z.number().positive(),
  // Benefits
  companyVehicle: z.boolean().default(false),
  vehicleValue: z.number().min(0).default(0), // MAD/month employer cost
  housingProvided: z.boolean().default(false),
  housingMonthlyValue: z.number().min(0).default(0), // MAD/month market value
  mealVouchers: z.number().min(0).default(0), // MAD/month
  phoneSubscription: z.number().min(0).default(0), // MAD/month employer pays
  transportAllowance: z.number().min(0).default(0), // MAD/month
  otherBenefitsValue: z.number().min(0).default(0), // MAD/month other taxable benefits
});

export type AvantagesNatureInput = z.infer<typeof avantagesNatureInputSchema>;

export type BenefitLine = {
  label: string;
  employerCost: number;
  taxableValue: number;
  note: string;
};

export type AvantagesNatureResult = {
  grossSalary: number;
  benefits: BenefitLine[];
  summary: {
    totalEmployerCost: number;
    totalTaxableValue: number;
    totalNonTaxableValue: number;
    realTotalCompensation: number; // gross + all employer costs
    taxableTotalCompensation: number; // gross + taxable benefits
    percentBenefitsInTotal: number;
  };
  explanation: {
    summary: string;
    warnings: string[];
    nextSteps: string[];
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

export function simulateAvantagesNature(raw: AvantagesNatureInput): AvantagesNatureResult {
  const input = avantagesNatureInputSchema.parse(raw);
  const benefits: BenefitLine[] = [];

  if (input.companyVehicle) {
    const taxableValue = input.vehicleValue > 0 ? input.vehicleValue : DGI_DEFAULTS.vehicleMonthlyTaxable;
    benefits.push({
      label: "Vehicule de societe",
      employerCost: roundMAD(input.vehicleValue || DGI_DEFAULTS.vehicleMonthlyTaxable),
      taxableValue: roundMAD(taxableValue),
      note: "Valeur forfaitaire si non precisee (5 000 MAD/mois). Taxable IR.",
    });
  }

  if (input.housingProvided) {
    const minTaxable = input.grossSalary * DGI_DEFAULTS.housingMinSalaryRatio;
    const taxableValue = Math.max(input.housingMonthlyValue, minTaxable);
    benefits.push({
      label: "Logement de fonction",
      employerCost: roundMAD(input.housingMonthlyValue),
      taxableValue: roundMAD(taxableValue),
      note: `Valeur taxable = max(valeur marchee, ${DGI_DEFAULTS.housingMinSalaryRatio * 100}% du brut).`,
    });
  }

  if (input.mealVouchers > 0) {
    benefits.push({
      label: "Tickets repas / Cantine",
      employerCost: roundMAD(input.mealVouchers),
      taxableValue: roundMAD(input.mealVouchers * DGI_DEFAULTS.mealTaxableRatio),
      note: "Valeur integrale taxable si au-dessus du tarif marche interne.",
    });
  }

  if (input.phoneSubscription > 0) {
    benefits.push({
      label: "Telephone / forfait",
      employerCost: roundMAD(input.phoneSubscription),
      taxableValue: roundMAD(input.phoneSubscription * DGI_DEFAULTS.phoneTaxableRatio),
      note: "50% de la valeur du forfait est taxable (usage mixte professionnel/personnel).",
    });
  }

  if (input.transportAllowance > 0) {
    const taxableTransport = Math.max(0, input.transportAllowance - DGI_DEFAULTS.transportExemptCap);
    benefits.push({
      label: "Indemnite de transport",
      employerCost: roundMAD(input.transportAllowance),
      taxableValue: roundMAD(taxableTransport),
      note: `Exoneration jusqu'a ${DGI_DEFAULTS.transportExemptCap} MAD/mois. Excedent taxable.`,
    });
  }

  if (input.otherBenefitsValue > 0) {
    benefits.push({
      label: "Autres avantages",
      employerCost: roundMAD(input.otherBenefitsValue),
      taxableValue: roundMAD(input.otherBenefitsValue),
      note: "Valeur integrale taxable par defaut.",
    });
  }

  const totalEmployerCost = roundMAD(benefits.reduce((s, b) => s + b.employerCost, 0));
  const totalTaxableValue = roundMAD(benefits.reduce((s, b) => s + b.taxableValue, 0));
  const totalNonTaxableValue = roundMAD(totalEmployerCost - totalTaxableValue);
  const realTotalCompensation = roundMAD(input.grossSalary + totalEmployerCost);
  const taxableTotalCompensation = roundMAD(input.grossSalary + totalTaxableValue);
  const percentBenefitsInTotal = realTotalCompensation > 0
    ? roundMAD((totalEmployerCost / realTotalCompensation) * 100)
    : 0;

  return {
    grossSalary: roundMAD(input.grossSalary),
    benefits,
    summary: {
      totalEmployerCost,
      totalTaxableValue,
      totalNonTaxableValue,
      realTotalCompensation,
      taxableTotalCompensation,
      percentBenefitsInTotal,
    },
    explanation: {
      summary: `Votre remuneration reelle totale est de ${realTotalCompensation} MAD/mois (salaire + avantages employeur). Les avantages representent ${percentBenefitsInTotal}% de la remuneration totale.`,
      warnings: [
        totalTaxableValue > 0
          ? `${totalTaxableValue} MAD/mois d'avantages en nature sont imposables — votre IR est calcule sur ${taxableTotalCompensation} MAD.`
          : "Aucun avantage imposable identifie.",
        "Verifiez les conventions collectives: certains avantages peuvent etre partiellement exoneres.",
      ],
      nextSteps: [
        "Incluez la valeur totale (cash + avantages) dans votre negociation salariale.",
        "Demandez a votre employeur de formaliser les avantages dans une lettre d'offre ou un avenant.",
        "Generez un rapport de package de remuneration complet.",
      ],
    },
  };
}
