import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Fin de CDD",
  description: "Calcul de prime de precarite, conges restants et compensation preavis.",
  canonicalPath: "/simulateurs/fin-cdd",
});

export default function FinCddPage() {
  return (
    <SimulatorToolPage
      title="Fin de CDD"
      description="Calcul de prime de precarite, conges restants et compensation preavis."
      apiPath="/api/simulate/fin-cdd"
      calculatorType="fin_cdd"
      fields={[
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "contractMonths", label: "Duree du contrat (mois)", type: "number", min: 1, step: 1 },
        {
          key: "contractSubtype",
          label: "Type de CDD",
          type: "select",
          options: [
            { label: "Standard", value: "standard" },
            { label: "Saisonnier", value: "seasonal" },
            { label: "Formation", value: "training" },
            { label: "Remplacement", value: "replacement" },
            { label: "Apprentissage", value: "apprenticeship" },
          ],
        },
        { key: "unusedLeaveDays", label: "Conges restants (jours)", type: "number", min: 0, step: 0.5 },
        { key: "renewalCount", label: "Nombre de renouvellements", type: "number", min: 0, max: 5, step: 1 },
        { key: "totalMonthsWithRenewals", label: "Duree totale avec renouvellements (mois)", type: "number", min: 1, max: 72, step: 1 },
        { key: "noticeDays", label: "Preavis compense (jours)", type: "number", min: 0, step: 1 },
      ]}
      breakdownLabels={{
        contractSubtype: "Type de CDD",
        contractGrossAmount: "Brut cumule",
        primePrecarite: "Prime precarite",
        primePrecariteRate: "Taux prime precarite",
        leavePayout: "Conges payes",
        noticeCompensation: "Compensation preavis",
        totalEndOfContractAmount: "Total fin CDD",
        requalificationRisk: "Risque requalification",
      }}
      units={{
        contractGrossAmount: "MAD",
        primePrecarite: "MAD",
        primePrecariteRate: "%",
        leavePayout: "MAD",
        noticeCompensation: "MAD",
        totalEndOfContractAmount: "MAD",
      }}
    />
  );
}
