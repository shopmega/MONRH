import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Duree de Preavis",
  description: "Calcul de la duree de preavis selon type de contrat, categorie et anciennete.",
  canonicalPath: "/simulateurs/duree-preavis",
});

export default function DureePreavisPage() {
  return (
    <SimulatorToolPage
      title="Duree de Preavis"
      description="Calculez le preavis requis (CDI ou CDD) selon la categorie professionnelle."
      apiPath="/api/simulate/duree-preavis"
      calculatorType="duree_preavis"
      fields={[
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
          label: "Categorie professionnelle",
          type: "select",
          defaultValue: "employe",
          options: [
            { value: "cadre", label: "Cadre / Technicien" },
            { value: "employe", label: "Employe" },
            { value: "ouvrier", label: "Ouvrier" },
          ],
        },
        { key: "yearsOfService", label: "Anciennete (annees)", type: "number", defaultValue: "2", min: 0, step: 1 },
        { key: "monthsOfService", label: "Mois supplementaires", type: "number", defaultValue: "0", min: 0, max: 11, step: 1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        totalServiceYears: "Anciennete",
        requiredNoticeMonths: "Preavis (mois)",
        requiredNoticeDays: "Preavis (jours)",
      }}
      units={{
        totalServiceYears: "ans",
        requiredNoticeMonths: "mois",
        requiredNoticeDays: "jours",
      }}
    />
  );
}

