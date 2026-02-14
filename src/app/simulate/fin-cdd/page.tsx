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
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", defaultValue: "7000", min: 1, step: 0.01 },
        { key: "contractMonths", label: "Duree du contrat (mois)", type: "number", defaultValue: "12", min: 1, step: 1 },
        { key: "unusedLeaveDays", label: "Conges restants (jours)", type: "number", defaultValue: "6", min: 0, step: 0.5 },
        { key: "precariteApplicable", label: "Prime precarite applicable", type: "checkbox", defaultValue: true },
        { key: "noticeDays", label: "Preavis compense (jours)", type: "number", defaultValue: "0", min: 0, step: 1 },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        contractGrossAmount: "Brut cumule",
        primePrecarite: "Prime precarite",
        leavePayout: "Conges payes",
        noticeCompensation: "Compensation preavis",
        totalEndOfContractAmount: "Total fin CDD",
      }}
      units={{
        contractGrossAmount: "MAD",
        primePrecarite: "MAD",
        leavePayout: "MAD",
        noticeCompensation: "MAD",
        totalEndOfContractAmount: "MAD",
      }}
    />
  );
}
