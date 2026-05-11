import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

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
            { label: "Cadre", value: "cadre" },
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
        { key: "hireDate", label: "Date d'embauche", type: "date", required: false },
        { key: "resignationNotificationDate", label: "Date de notification de la demission", type: "date", required: false },
        { key: "unusedLeaveDays", label: "Conges restants (jours)", type: "number", min: 0, step: 0.5 },
        {
          key: "noticeStatus",
          label: "Statut du preavis",
          type: "select",
          defaultValue: "served",
          options: [
            { value: "served", label: "Execute" },
            { value: "not_served", label: "Non execute" },
            { value: "waived_by_employer", label: "Dispense par l'employeur" },
            { value: "negotiated_release", label: "Accord amiable" },
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
        resignationNotificationDate: "Date de notification",
        cddRuptureReason: "Motif CDD",
        totalServiceYears: "Anciennete",
        requiredNoticeMonths: "Preavis requis",
        requiredNoticeDays: "Preavis requis",
        recommendedDepartureDate: "Date de depart estimee",
        leavePayout: "Indemnite conges",
        noticeComplianceStatus: "Statut du preavis",
        potentialNoticeValue: "Valeur potentielle du preavis",
        netFinancialOutcome: "Resultat net",
        cddNote: "Analyse CDD",
      }}
      units={{
        totalServiceYears: "ans",
        requiredNoticeMonths: "mois",
        requiredNoticeDays: "jours",
        leavePayout: "MAD",
        potentialNoticeValue: "MAD",
        netFinancialOutcome: "MAD",
      }}
    />
  );
}
