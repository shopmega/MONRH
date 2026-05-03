import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { SimulatorToolPage } from "@/components/simulator-tool-page-wrapper";

export const metadata: Metadata = buildPageMetadata({
  title: "Scenario Harcelement",
  description: "Evaluation du dossier de harcelement moral ou sexuel et niveau d'escalade recommande.",
  canonicalPath: "/simulateurs/scenario-harcelement",
});

export default function HarassmentScenarioPage() {
  return (
    <SimulatorToolPage
      title="Scenario Harcelement"
      description="Evaluation de la solidite du dossier selon le type de harcelement, les preuves et la relation avec l'auteur."
      apiPath="/api/simulate/harassment-scenario"
      calculatorType="harassment_scenario"
      fields={[
        { key: "calculationDate", label: "Date de calcul", type: "date" },
        { key: "firstIncidentDate", label: "Premier incident", type: "date" },
        { key: "lastIncidentDate", label: "Dernier incident", type: "date" },
        {
          key: "harassmentType", label: "Type de harcelement", type: "select", defaultValue: "moral", options: [
            { value: "moral", label: "Harcelement moral (Art. 40 CT)" },
            { value: "sexual", label: "Harcelement sexuel (Art. 40 CT + Code penal)" },
          ]
        },
        {
          key: "perpetratorRelationship", label: "Lien avec l'auteur", type: "select", defaultValue: "supervisor", options: [
            { value: "supervisor", label: "Superieur hierarchique" },
            { value: "colleague", label: "Collegue" },
            { value: "client", label: "Client / Tiers" },
          ]
        },
        { key: "incidentsCount", label: "Incidents documentes", type: "number", min: 1, step: 1, defaultValue: 1 },
        { key: "witnessesCount", label: "Temoins disponibles", type: "number", min: 0, step: 1 },
        { key: "hasIncidentLog", label: "Journal date des incidents", type: "checkbox" },
        { key: "hasWrittenProof", label: "Preuves ecrites (emails, SMS...)", type: "checkbox" },
        { key: "hasMedicalProof", label: "Certificat medical", type: "checkbox" },
        { key: "hrNotified", label: "RH / DRH notifie par ecrit", type: "checkbox" },
        {
          key: "companySize", label: "Taille de l'entreprise", type: "select", defaultValue: "large", options: [
            { value: "small", label: "< 10 salaries" },
            { value: "large", label: ">= 10 salaries" },
          ]
        },
      ]}
      breakdownLabels={{
        harassmentType: "Type",
        perpetratorRelationship: "Auteur",
        dossierStrengthScore: "Score dossier",
        evidenceReadinessPercent: "Preparation",
        recommendedEscalationLevel: "Escalade recommandee",
        employerLiabilityRisk: "Responsabilite employeur",
      }}
      units={{
        dossierStrengthScore: "/100",
        evidenceReadinessPercent: "%",
      }}
    />
  );
}
