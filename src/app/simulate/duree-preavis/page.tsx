import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul Preavis Demission Maroc",
  description: "Calculez la duree de preavis au Maroc selon le contrat, la categorie professionnelle et l'anciennete.",
  canonicalPath: "/simulateurs/duree-preavis",
});

export default function DureePreavisPage() {
  return (
    <SimulatorToolPage
      title="Calcul preavis demission Maroc"
      description="Calculez le preavis CDI a partir de la date d'embauche. Pour un CDD, qualifiez d'abord le motif de rupture."
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
            { value: "cadre", label: "Cadre" },
            { value: "employe", label: "Employe" },
            { value: "ouvrier", label: "Ouvrier" },
          ],
        },
        { key: "hireDate", label: "Date d'embauche", type: "date", required: false },
        { key: "notificationDate", label: "Date de notification", type: "date", required: false },
        {
          key: "ruptureInitiator",
          label: "Initiateur de la rupture",
          type: "select",
          defaultValue: "salarie",
          options: [
            { value: "salarie", label: "Salarie" },
            { value: "employeur", label: "Employeur" },
          ],
        },
        {
          key: "cddRuptureReason",
          label: "Motif de rupture CDD",
          type: "select",
          visibleIf: { field: "contractType", equals: "CDD" },
          options: [
            { value: "term_expiry", label: "Fin normale du terme" },
            { value: "mutual_agreement", label: "Accord amiable" },
            { value: "serious_misconduct", label: "Faute grave" },
            { value: "force_majeure", label: "Force majeure" },
            { value: "early_unilateral_employee", label: "Rupture anticipee par le salarie" },
            { value: "early_unilateral_employer", label: "Rupture anticipee par l'employeur" },
            { value: "unknown", label: "Motif non determine" },
          ],
        },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        hireDate: "Date d'embauche",
        notificationDate: "Date de notification",
        ruptureInitiator: "Initiateur",
        cddRuptureReason: "Motif CDD",
        serviceInputMode: "Mode anciennete",
        totalServiceYears: "Anciennete",
        requiredNoticeMonths: "Preavis (mois)",
        requiredNoticeDays: "Preavis (jours)",
        noticeLegalStatus: "Statut legal",
      }}
      units={{
        totalServiceYears: "ans",
        requiredNoticeMonths: "mois",
        requiredNoticeDays: "jours",
      }}
    />
  );
}
