import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Rupture Periode d'Essai",
  description: "Estimation de la compensation de preavis selon la categorie et la duree d'essai.",
  canonicalPath: "/simulateurs/rupture-periode-essai",
});

export default function ProbationTerminationPage() {
  return (
    <SimulatorToolPage
      title="Rupture Periode d'Essai"
      description="Estimation du preavis requis et compensation selon categorie professionnelle (Art. 14 CT)."
      apiPath="/api/simulate/probation-termination"
      calculatorType="probation_termination"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        {
          key: "workerCategory", label: "Categorie professionnelle", type: "select", options: [
            { value: "ouvrier", label: "Ouvrier" },
            { value: "employe", label: "Employe" },
            { value: "cadre", label: "Cadre" },
          ]
        },
        { key: "workedDays", label: "Jours travailles pendant l'essai", type: "number", min: 1, step: 1 },
        { key: "probationDurationMonths", label: "Duree periode d'essai (mois)", type: "number", min: 1, max: 12, step: 1 },
        { key: "probationRenewed", label: "Periode d'essai renouvelee", type: "checkbox" },
        {
          key: "initiator", label: "Initiateur de la rupture", type: "select", options: [
            { value: "employer", label: "Employeur" },
            { value: "employee", label: "Salarie" },
          ]
        },
        { key: "noticeDaysGiven", label: "Preavis donne (jours)", type: "number", min: 0, step: 1 },
      ]}
      breakdownLabels={{
        category: "Categorie",
        probationDurationMonths: "Duree d'essai",
        requiredNoticeDays: "Preavis requis",
        noticeDaysGiven: "Preavis donne",
        missingNoticeDays: "Jours manquants",
        compensationDue: "Compensation",
        probationLegallyValid: "Essai conforme",
      }}
      units={{
        probationDurationMonths: "mois",
        requiredNoticeDays: "jours",
        noticeDaysGiven: "jours",
        missingNoticeDays: "jours",
        compensationDue: "MAD",
      }}
    />
  );
}
