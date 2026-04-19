import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul Preavis Demission Maroc",
  description: "Calculez la duree de preavis au Maroc selon le contrat, la categorie professionnelle et l'anciennete.",
  canonicalPath: "/simulateurs/duree-preavis",
});

export default function DureePreavisPage() {
  return (
    <SimulatorToolPage
      title="Calcul preavis demission Maroc"
      description="Calculez le preavis requis en CDI ou CDD selon la categorie professionnelle et l'anciennete."
      apiPath="/api/simulate/duree-preavis"
      calculatorType="duree_preavis"
      fields={[
        {
          key: "contractType",
          label: "Type de contrat",
          type: "select",
          options: [
            { value: "CDI", label: "CDI" },
            { value: "CDD", label: "CDD" },
          ],
        },
        {
          key: "workerCategory",
          label: "Categorie professionnelle",
          type: "select",
          options: [
            { value: "cadre", label: "Cadre / Technicien" },
            { value: "employe", label: "Employe" },
            { value: "ouvrier", label: "Ouvrier" },
          ],
        },
        { key: "hireDate", label: "Date d'embauche", type: "date" },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        hireDate: "Date d'embauche",
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
