import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Scenario Demission",
  description: "Estimation de l'impact financier d'une demission.",
  canonicalPath: "/simulateurs/demission",
});

export default function DemissionPage() {
  return (
    <SimulatorToolPage
      title="Scenario Demission"
      description="Estimation de l'impact financier d'une demission."
      apiPath="/api/simulate/demission"
      calculatorType="demission"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "9000", min: 1, step: 0.01 },
        {
          key: "workerCategory",
          label: "Categorie professionnelle",
          type: "select",
          defaultValue: "employe",
          options: [
            { label: "Ouvrier", value: "ouvrier" },
            { label: "Employe", value: "employe" },
            { label: "Cadre / Technicien", value: "cadre" },
          ],
        },
        {
          key: "contractType",
          label: "Type de contrat",
          type: "select",
          defaultValue: "CDI",
          options: [
            { label: "CDI", value: "CDI" },
            { label: "CDD", value: "CDD" },
          ],
        },
        { key: "yearsOfService", label: "Anciennete (annees)", type: "number", defaultValue: "3", min: 0, step: 1 },
        { key: "monthsOfService", label: "Mois supplementaires", type: "number", defaultValue: "0", min: 0, max: 11, step: 1 },
        { key: "unusedLeaveDays", label: "Conges restants (jours)", type: "number", defaultValue: "8", min: 0, step: 0.5 },
        { key: "noticeServed", label: "Preavis execute", type: "checkbox", defaultValue: true },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        totalServiceYears: "Anciennete",
        requiredNoticeMonths: "Preavis requis",
        leavePayout: "Indemnite conges",
        noticeCompensationDue: "Compensation preavis",
        netFinancialOutcome: "Resultat net",
      }}
      units={{
        totalServiceYears: "ans",
        requiredNoticeMonths: "mois",
        leavePayout: "MAD",
        noticeCompensationDue: "MAD",
        netFinancialOutcome: "MAD",
      }}
    />
  );
}
