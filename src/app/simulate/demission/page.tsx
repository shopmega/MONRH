import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Demissionner au Maroc: Droits et Preavis",
  description: "Simulez vos droits apres demission au Maroc: preavis, conges restants et impact financier.",
  canonicalPath: "/simulateurs/demission",
});

export default function DemissionPage() {
  return (
    <SimulatorToolPage
      title="Demissionner au Maroc"
      description="Estimez vos droits apres demission: preavis, conges restants et impact financier."
      apiPath="/api/simulate/demission"
      calculatorType="demission"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        {
          key: "workerCategory",
          label: "Categorie professionnelle",
          type: "select",
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
          options: [
            { label: "CDI", value: "CDI" },
            { label: "CDD", value: "CDD" },
          ],
        },
        { key: "hireDate", label: "Date d'embauche", type: "date" },
        { key: "unusedLeaveDays", label: "Conges restants (jours)", type: "number", min: 0, step: 0.5 },
        { key: "noticeServed", label: "Preavis execute", type: "checkbox" },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        hireDate: "Date d'embauche",
        totalServiceYears: "Anciennete",
        requiredNoticeMonths: "Preavis requis",
        recommendedDepartureDate: "Date de depart estimee",
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
