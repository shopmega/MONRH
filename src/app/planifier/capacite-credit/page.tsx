import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Capacite Credit — Montant Empruntable",
  description: "Calculez votre capacite d'emprunt selon votre salaire net et la regle des 33% des banques marocaines.",
  canonicalPath: "/planifier/capacite-credit",
});

export default function LoanCapacityPage() {
  return (
    <SimulatorToolPage
      title="Capacite Credit (Pret Immobilier)"
      description="Estimez le montant maximum que vous pouvez emprunter selon votre salaire net, vos credits existants et les scenarios de duree."
      apiPath="/api/simulate/loan-capacity"
      calculatorType="loan_capacity"
      fields={[
        { key: "netSalary", label: "Salaire net mensuel (MAD)", type: "number", defaultValue: "8000", min: 1, step: 0.01 },
        { key: "otherMonthlyDebts", label: "Credits existants (MAD/mois)", type: "number", defaultValue: "0", min: 0, step: 0.01 },
        { key: "annualRate", label: "Taux annuel (%)", type: "number", defaultValue: "0.045", min: 0, max: 0.25, step: 0.001 },
        { key: "termYears", label: "Duree (annees)", type: "number", defaultValue: "20", min: 1, max: 30, step: 1 },
      ]}
      breakdownLabels={{
        netSalary: "Salaire net",
        maxMonthlyPayment: "Mensualite max (33%)",
        availableAfterDebts: "Disponible apres credits",
        maxLoanAmount: "Montant max empruntable",
      }}
      units={{
        netSalary: "MAD",
        maxMonthlyPayment: "MAD",
        availableAfterDebts: "MAD",
        maxLoanAmount: "MAD",
      }}
    />
  );
}
