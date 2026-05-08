import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul Indemnite Licenciement Maroc",
  description: "Estimez vos indemnites de licenciement au Maroc: indemnite legale, preavis, conges et total de sortie.",
  canonicalPath: "/simulateurs/licenciement",
});

export default function LicenciementPage() {
  return (
    <SimulatorToolPage
      title="Calcul indemnite licenciement Maroc"
      description="Estimez l'indemnite legale, le preavis, les conges restants et le total de sortie au Maroc."
      apiPath="/api/simulate/licenciement"
      calculatorType="licenciement"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 0, step: 0.01 },
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
          key: "dismissalReason",
          label: "Motif de rupture",
          type: "select",
          options: [
            { value: "personal", label: "Motif personnel" },
            { value: "economic", label: "Motif economique" },
            { value: "serious_misconduct", label: "Faute grave" },
            { value: "force_majeure", label: "Force majeure" },
            { value: "unknown", label: "Motif non determine" },
          ],
        },
        {
          key: "workerCategory",
          label: "Categorie",
          type: "select",
          options: [
            { value: "cadre", label: "Cadre" },
            { value: "employe", label: "Employe" },
            { value: "ouvrier", label: "Ouvrier" },
          ],
        },
        { key: "hireDate", label: "Date d'embauche", type: "date" },
        { key: "dismissalNotificationDate", label: "Date de notification du licenciement", type: "date", required: false },
        { key: "unusedLeaveDays", label: "Jours de conges restants", type: "number", min: 0, step: 0.5 },
        { key: "procedureCompliant", label: "Procedure de licenciement respectee", type: "checkbox", defaultValue: true },
      ]}
      breakdownLabels={{
        contractType: "Type de contrat",
        workerCategory: "Categorie",
        hireDate: "Date d'embauche",
        dismissalNotificationDate: "Date de notification",
        dismissalReason: "Motif de rupture",
        procedureCompliant: "Procedure conforme",
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
