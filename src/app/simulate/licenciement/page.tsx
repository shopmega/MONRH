import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Indemnite Licenciement",
  description: "Estimation de l'indemnite legale, preavis, conges restants et total.",
  canonicalPath: "/contrat-depart/licenciement",
});

export default function LicenciementPage() {
  return (
    <SimulatorToolPage
      title="Indemnite Licenciement"
      description="Estimation de l'indemnite legale, preavis, conges restants et total."
      apiPath="/api/simulate/licenciement"
      calculatorType="licenciement"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "9000", min: 0, step: 0.01 },
        {
          key: "contractType",
          label: "Type de contrat",
          type: "select",
          defaultValue: "CDI",
          options: [
            { value: "CDI", label: "CDI" },
            { value: "CDD", label: "CDD" },
          ],
        },
        {
          key: "workerCategory",
          label: "Categorie",
          type: "select",
          defaultValue: "employe",
          options: [
            { value: "cadre", label: "Cadre" },
            { value: "employe", label: "Employe" },
            { value: "ouvrier", label: "Ouvrier" },
          ],
        },
        { key: "yearsOfService", label: "Annees d'anciennete", type: "number", defaultValue: "4", min: 0, step: 1 },
        { key: "monthsOfService", label: "Mois supplementaires", type: "number", defaultValue: "0", min: 0, step: 1 },
        { key: "unusedLeaveDays", label: "Jours de conges restants", type: "number", defaultValue: "10", min: 0, step: 0.5 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
        { key: "abusive", label: "Licenciement abusif (estimation dommages)", type: "checkbox", defaultValue: false },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        totalServiceYears: "Anciennete",
        indemnityLegale: "Indemnite legale",
        indemnitePreavis: "Indemnite preavis",
        congesPayesRestants: "Conges restants",
        dommagesAbusif: "Dommages abusif",
        totalEstimated: "Total estime",
      }}
      units={{
        contractType: "",
        workerCategory: "",
        totalServiceYears: "ans",
        indemnityLegale: "MAD",
        indemnitePreavis: "MAD",
        congesPayesRestants: "MAD",
        dommagesAbusif: "MAD",
        totalEstimated: "MAD",
      }}
    />
  );
}
