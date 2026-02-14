import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Scenario Harcelement",
  description: "Evaluation de preparation du dossier et niveau d'escalade recommande.",
  canonicalPath: "/simulateurs/scenario-harcelement",
});

export default function HarassmentScenarioPage() {
  return (
    <SimulatorToolPage
      title="Scenario Harcelement"
      description="Evaluation de preparation du dossier et niveau d'escalade recommande."
      apiPath="/api/simulate/harassment-scenario"
      calculatorType="harassment_scenario"
      fields={[
        { key: "incidentsCount", label: "Nombre d'incidents documentes", type: "number", defaultValue: "6", min: 1, step: 1 },
        { key: "witnessesCount", label: "Nombre de temoins", type: "number", defaultValue: "1", min: 0, step: 1 },
        { key: "hasWrittenProof", label: "Preuves ecrites disponibles", type: "checkbox", defaultValue: true },
        { key: "hasMedicalProof", label: "Justificatifs medicaux", type: "checkbox", defaultValue: false },
        { key: "calculationDate", label: "Date de calcul", type: "date", defaultValue: "2026-02-12" },
      ]}
      breakdownLabels={{
        dossierStrengthScore: "Score dossier",
        recommendedEscalationLevel: "Escalade recommandee",
        evidenceReadinessPercent: "Preparation",
      }}
      units={{
        dossierStrengthScore: "/100",
        evidenceReadinessPercent: "%",
      }}
    />
  );
}
