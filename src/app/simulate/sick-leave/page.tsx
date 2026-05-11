import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Arret Maladie",
  description: "Estimation de compensation CNSS, eligibilite et perte de revenu reelle.",
  canonicalPath: "/simulateurs/conge-maladie",
});

export default function SickLeavePage() {
  return (
    <SimulatorToolPage
      title="Arret Maladie"
      description="Estimation de compensation CNSS, eligibilite et perte de revenu reelle."
      apiPath="/api/simulate/sick-leave"
      calculatorType="sick_leave"
      fields={[
        { key: "calculationDate", label: "Date de calcul", type: "date", required: false },
        { key: "monthlySalary", label: "Salaire mensuel (MAD)", type: "number", min: 1, step: 0.01 },
        { key: "leaveStartDate", label: "Debut arret maladie", type: "date", required: false },
        { key: "leaveEndDate", label: "Fin arret maladie", type: "date", required: false },
        { key: "cnssEligibilityDays", label: "Jours CNSS cotises (6 derniers mois)", type: "number", min: 0, step: 1 },
        { key: "employerTopUp", label: "Complement employeur (100% convention)", type: "checkbox" },
        { key: "employerTopUpRate", label: "Taux complement employeur (0 a 1)", type: "number", min: 0, max: 1, step: 0.1 },
        { key: "medicalCertificateSubmitted", label: "Certificat medical transmis", type: "checkbox" },
      ]}
      breakdownLabels={{
        cnssEligible: "Eligible CNSS",
        waitingDays: "Jours de carence",
        paidDaysByCnss: "Jours indemnises CNSS",
        cnssCompensation: "Indemnisation CNSS",
        employerTopUpAmount: "Complement employeur",
        totalCompensation: "Compensation totale",
        grossIncomeEquivalent: "Equivalent brut",
        estimatedIncomeLoss: "Perte nette estimee",
      }}
      units={{
        waitingDays: "jours",
        paidDaysByCnss: "jours",
        cnssCompensation: "MAD",
        employerTopUpAmount: "MAD",
        totalCompensation: "MAD",
        grossIncomeEquivalent: "MAD",
        estimatedIncomeLoss: "MAD",
      }}
    />
  );
}
