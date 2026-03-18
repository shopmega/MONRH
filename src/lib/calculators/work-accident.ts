import { z } from "zod";
import { getSocialProtectionRulesByDate } from "@/lib/rules/default-rules";
import { type CalculatorExplanation, roundMAD } from "@/lib/calculators/shared";

export const workAccidentInputSchema = z.object({
  calculationDate: z.string().date().default("2026-02-12"),
  monthlySalary: z.number().positive(),
  temporaryIncapacityDays: z.number().min(0).max(730).default(0),
  /** IPP% as certified by medical board — 0 means no permanent incapacity */
  permanentIncapacityPercent: z.number().min(0).max(100).default(0),
  /** Was the accident declared by the employer within 48h (legal obligation)? */
  accidentDeclared: z.boolean().default(true),
  /** Does the employee allege employer gross negligence (faute inexcusable)? */
  fauteInexcusable: z.boolean().default(false),
  /** Was the employee's employment contract terminated during the accident leave? */
  contractTerminatedDuringAT: z.boolean().default(false),
});

export type WorkAccidentInput = z.infer<typeof workAccidentInputSchema>;

export type WorkAccidentResult = {
  versionId: string;
  versionCode: string;
  breakdown: {
    temporaryCompensation: number;
    monthlyPermanentRente: number;
    annualPermanentRente: number;
    fauteInexcusableBonus: number;
    totalFirstYearEstimate: number;
    accidentDeclared: boolean;
    terminationIllegal: boolean;
    terminationNote?: string;
    declarationWarning?: string;
  };
  explanation: CalculatorExplanation;
};

export function simulateWorkAccident(rawInput: WorkAccidentInput): WorkAccidentResult {
  const input = workAccidentInputSchema.parse(rawInput);
  const rules = getSocialProtectionRulesByDate(input.calculationDate);

  const dailySalary = input.monthlySalary / 26;

  // Temporary incapacity — covered from day 1 (no waiting period for AT contrary to maladie)
  const temporaryCompensation = roundMAD(
    dailySalary * input.temporaryIncapacityDays * rules.workAccidentTemporaryCoverageRate,
  );

  // Permanent incapacity (rente) — apply reduction/increase logic (Dahir 1963)
  const ipp = input.permanentIncapacityPercent;
  const baseIpp = Math.min(ipp, 50);
  const excessIpp = Math.max(0, ipp - 50);
  const adjustedIppPercent = baseIpp * 0.5 + excessIpp * 1.5;

  const monthlyPermanentRente = roundMAD(
    input.monthlySalary * (adjustedIppPercent / 100),
  );
  const annualPermanentRente = roundMAD(monthlyPermanentRente * 12);

  // Faute inexcusable: multiplier on rente (up to 2x typically, per CNSS/jurisprudence)
  const fauteInexcusableBonus = input.fauteInexcusable
    ? roundMAD(
      monthlyPermanentRente * (rules.workAccidentFauteInexcusableMultiplier - 1) * 12,
    )
    : 0;

  const totalFirstYearEstimate = roundMAD(
    temporaryCompensation + annualPermanentRente + fauteInexcusableBonus,
  );

  // Contract termination during AT leave is prohibited (Art. 274 CT) — signals illegality
  const terminationIllegal = input.contractTerminatedDuringAT;
  const terminationNote = terminationIllegal
    ? "La rupture du contrat de travail pendant un arret pour accident du travail est nulle de droit (Art. 274 CT). L'employe peut exiger reintegration ou indemnites specifiques."
    : undefined;

  const declarationWarning = !input.accidentDeclared
    ? "Accident non declare par l'employeur dans les 48h: l'employeur peut etre tenu responsable des frais medicaux. Le salarie peut declarer lui-meme a la CNSS."
    : undefined;

  return {
    versionId: rules.versionId,
    versionCode: rules.versionCode,
    breakdown: {
      temporaryCompensation,
      monthlyPermanentRente,
      annualPermanentRente,
      fauteInexcusableBonus,
      totalFirstYearEstimate,
      accidentDeclared: input.accidentDeclared,
      terminationIllegal,
      ...(terminationNote ? { terminationNote } : {}),
      ...(declarationWarning ? { declarationWarning } : {}),
    },
    explanation: {
      summary: `Indemnisation 1ere annee estimee: ${totalFirstYearEstimate} MAD${terminationIllegal ? " — ATTENTION: licenciement en AT interdit!" : ""}`,
      assumptions: [
        "Incapacite temporaire (IT): indemnisee sans delai de carence (AT ≠ maladie ordinaire).",
        `Taux couverture IT: ${roundMAD(rules.workAccidentTemporaryCoverageRate * 100)}% du salaire journalier.`,
        `Rente IP: salaire mensuel x taux d'incapacite ajuste (${adjustedIppPercent}%).`,
        "L'ipp est reduit de moitie sous 50% et augmente de moitie au-dela.",
        input.fauteInexcusable
          ? `Faute inexcusable: majoration de la rente par facteur x${rules.workAccidentFauteInexcusableMultiplier}.`
          : "",
        input.contractTerminatedDuringAT ? "Licenciement pendant AT: statut juridique a clarifier d'urgence." : "",
      ].filter(Boolean),
      formulas: [
        "IT = salaire journalier x jours ITA x taux couverture.",
        "IPP Ajuste = (T aux <= 50% / 2) + (T aux > 50% * 1.5).",
        "Rente mensuelle IP = salaire mensuel x IPP Ajuste.",
        "Majoration FI = rente annuelle x (facteur - 1) si faute inexcusable.",
        "Total 1ere annee = IT + rente annuelle + majoration FI.",
      ],
      warnings: [
        !input.accidentDeclared
          ? "Accident non declare: risque de perte de droits CNSS AT — agir dans les 48h."
          : "",
        terminationIllegal
          ? "URGENT: licenciement pendant AT est illicite (Art. 274 CT) — saisir l'inspection du travail immediatement."
          : "",
        "Le taux d'IPP est fixe par expertise medicale CNSS — la valeur saisie est estimative.",
        "Le bareme medico-legal reel peut differer selon expertise et contestation.",
      ].filter(Boolean),
      nextSteps: [
        !input.accidentDeclared ? "Declarer l'accident vous-meme a la CNSS (formulaire DAT) si l'employeur ne le fait pas." : "",
        "Constituer un dossier: certificat medical, rapport accident, temoin si possible.",
        input.fauteInexcusable
          ? "Pour la faute inexcusable: saisir le tribunal du travail — assistance juridique recommandee."
          : "",
        terminationIllegal
          ? "Contester le licenciement devant le tribunal du travail (action en nullite + reintegration)."
          : "",
        "Demander le releve de prise en charge CNSS AT pour suivi des frais medicaux.",
      ].filter(Boolean),
    },
  };
}
