import { z } from "zod";
import { getSalaryRulesByDate } from "@/lib/rules/default-rules";
import {
  computeMonthlyPayrollFromGross,
  estimateGrossFromTargetNet,
  payrollCoreInputSchema,
  payrollFamilySituationSchema,
  roundMAD,
  type PayrollMonthlyResult,
} from "@/lib/calculators/payroll-core";

const directionSchema = z.enum(["gross_to_net", "net_to_gross"]);

export const netGrossInputSchema = payrollCoreInputSchema.extend({
  direction: directionSchema,
  amount: z.number().positive(),
  familySituation: payrollFamilySituationSchema.default("single"),
});

export type NetGrossInput = z.input<typeof netGrossInputSchema>;

type Breakdown = Omit<PayrollMonthlyResult, "versionId" | "versionCode" | "calculationDate" | "marginalRate">;

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

function toBreakdown(result: PayrollMonthlyResult): Breakdown {
  const { versionId: _versionId, versionCode: _versionCode, calculationDate: _calculationDate, marginalRate: _marginalRate, ...breakdown } = result;
  return breakdown;
}

export function simulateNetGross(rawInput: NetGrossInput): NetGrossResult {
  const input = netGrossInputSchema.parse(rawInput);
  const rules = getSalaryRulesByDate(input.calculationDate);

  if (input.direction === "gross_to_net") {
    const breakdown = toBreakdown(computeMonthlyPayrollFromGross(input.amount, input));
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

  const breakdown = toBreakdown(estimateGrossFromTargetNet(input.amount, input));
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
