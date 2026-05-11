import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Accident du Travail",
  description: "Estimation d'indemnisation temporaire et permanente.",
  canonicalPath: "/simulateurs/accident-travail",
});

export default function WorkAccidentPage() {
  return (
    <SimulatorToolPage
      title="Accident du Travail"
      description="Estimation d'indemnisation temporaire et permanente."
      apiPath="/api/simulate/work-accident"
      calculatorType="work_accident"
      fields={[
        { key: "calculationDate", label: "Date de calcul", type: "date", required: false },
        { key: "accidentDate", label: "Date accident", type: "date", required: false },
        { key: "declarationDate", label: "Date declaration", type: "date", required: false },
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "temporaryIncapacityDays", label: "Jours incapacite temporaire", type: "number", min: 0, step: 1 },
        { key: "permanentIncapacityPercent", label: "Taux incapacite permanente (%)", type: "number", min: 0, max: 100, step: 1 },
        { key: "accidentDeclared", label: "Accident declare dans les 48h", type: "checkbox" },
        { key: "hasMedicalCertificate", label: "Certificat medical initial", type: "checkbox" },
        { key: "hasWitnessReport", label: "Rapport ou temoignage", type: "checkbox" },
        { key: "fauteInexcusable", label: "Faute inexcusable de l'employeur", type: "checkbox" },
        { key: "contractTerminatedDuringAT", label: "Contrat rompu pendant l'AT", type: "checkbox" },
      ]}
      breakdownLabels={{
        temporaryCompensation: "Indemnite temporaire",
        monthlyPermanentRente: "Rente mensuelle",
        annualPermanentRente: "Rente annuelle",
        fauteInexcusableBonus: "Majoration faute inexcusable",
        totalFirstYearEstimate: "Total 1ere annee",
        terminationIllegal: "Rupture illicite",
      }}
      units={{
        temporaryCompensation: "MAD",
        monthlyPermanentRente: "MAD",
        annualPermanentRente: "MAD",
        fauteInexcusableBonus: "MAD",
        totalFirstYearEstimate: "MAD",
      }}
    />
  );
}
