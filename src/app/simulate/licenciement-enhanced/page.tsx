import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { EnhancedSimulatorToolPage } from "@/components/enhanced-simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Indemnité Licenciement Améliorée",
  description: "Calcul des indemnités de licenciement avec motifs et contexte juridique complet.",
  canonicalPath: "/simulateurs/licenciement-avance",
});

export default function LicenciementEnhancedPage() {
  return (
    <EnhancedSimulatorToolPage
      title="Indemnité Licenciement Améliorée"
      description="Calcul des indemnités de licenciement avec motifs et contexte juridique complet."
      apiPath="/api/simulate/licenciement-enhanced"
      calculatorType="licenciement_enhanced"
      fields={[
        { 
          key: "monthlySalary", 
          label: "Salaire mensuel (MAD)", 
          type: "number", 
          defaultValue: "9000", 
          min: 1, 
          step: 0.01 
        },
        { 
          key: "contractType", 
          label: "Type de contrat", 
          type: "select", 
          defaultValue: "CDI",
          options: [
            { value: "CDI", label: "CDI" },
            { value: "CDD", label: "CDD" },
            { value: "apprentissage", label: "Apprentissage" },
            { value: "interim", label: "Intérim" },
            { value: "temps_partiel", label: "Temps partiel" }
          ]
        },
        { 
          key: "workerCategory", 
          label: "Catégorie professionnelle", 
          type: "select", 
          defaultValue: "employe",
          options: [
            { value: "cadre", label: "Cadre" },
            { value: "employe", label: "Employé" },
            { value: "ouvrier", label: "Ouvrier" }
          ]
        },
        { 
          key: "yearsOfService", 
          label: "Années d'ancienneté", 
          type: "number", 
          defaultValue: 3, 
          min: 0, 
          max: 50, 
          step: 1 
        },
        { 
          key: "monthsOfService", 
          label: "Mois supplémentaires", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          max: 11, 
          step: 1 
        },
        { 
          key: "unusedLeaveDays", 
          label: "Jours de congés restants", 
          type: "number", 
          defaultValue: 6, 
          min: 0, 
          max: 365, 
          step: 0.5 
        },
        { 
          key: "dismissalReason", 
          label: "Motif de rupture", 
          type: "select", 
          defaultValue: "personal",
          options: [
            { value: "personal", label: "Licenciement (motif personnel)" },
            { value: "economic", label: "Motif économique" },
            { value: "demission", label: "Démission" },
            { value: "misconduct", label: "Faute grave" },
            { value: "force_majeure", label: "Force majeure" },
            { value: "retraite", label: "Départ retraite" },
            { value: "abandon", label: "Abandon de poste" }
          ]
        },
        { 
          key: "dismissalReasonDetails", 
          label: "Détails du motif", 
          type: "text", 
          defaultValue: "" 
        },
        { 
          key: "priorWarnings", 
          label: "Avertissements préalables", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          max: 10 
        },
        { 
          key: "warningDates", 
          label: "Dates des avertissements", 
          type: "text", 
          defaultValue: "" 
        },
        { 
          key: "unionRepresentative", 
          label: "Représentant syndical", 
          type: "checkbox", 
          defaultValue: false 
        },
        { 
          key: "departmentSize", 
          label: "Taille du département", 
          type: "number", 
          defaultValue: 10, 
          min: 1, 
          max: 1000 
        },
        { 
          key: "priorDisciplinaryActions", 
          label: "Actions disciplinaires antérieures", 
          type: "checkbox", 
          defaultValue: false 
        },
        { 
          key: "performanceReviews", 
          label: "Évaluations de performance", 
          type: "checkbox", 
          defaultValue: false 
        },
        { 
          key: "hrNotified", 
          label: "Notification RH écrite", 
          type: "checkbox", 
          defaultValue: false 
        },
        { 
          key: "hrNotificationDate", 
          label: "Date de notification RH", 
          type: "date", 
          defaultValue: "" 
        },
        { 
          key: "abusive", 
          label: "Licenciement abusif présumé", 
          type: "checkbox", 
          defaultValue: false 
        },
        { 
          key: "abusiveDetails", 
          label: "Détails abusif", 
          type: "text", 
          defaultValue: "" 
        },
        { 
          key: "calculationDate", 
          label: "Date de calcul", 
          type: "date", 
          defaultValue: "2026-03-31" 
        },
      ]}
      breakdownLabels={{
        legalIndemnity: "Indemnité légale",
        noticeIndemnity: "Indemnité de préavis",
        leavePayout: "Paiement congés restants",
        abusiveDamages: "Dommages abusifs",
        totalEstimated: "Total estimé",
        legalRiskLevel: "Niveau de risque juridique",
        recommendedActions: "Actions recommandées",
        proceduralCompliance: "Conformité procédurale"
      }}
      units={{
        legalIndemnity: "MAD",
        noticeIndemnity: "MAD",
        leavePayout: "MAD",
        abusiveDamages: "MAD",
        totalEstimated: "MAD",
        legalRiskLevel: "/10",
        recommendedActions: "actions",
        proceduralCompliance: "%"
      }}
    />
  );
}
