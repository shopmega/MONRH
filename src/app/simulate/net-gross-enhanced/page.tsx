import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { EnhancedSimulatorToolPage } from "@/components/enhanced-simulator-tool-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Calculateur Brut/Net Amélioré",
  description: "Calcul du salaire brut/net avec situation familiale et avantages légaux.",
  canonicalPath: "/simulateurs/brut-net-avance",
});

export default function NetGrossEnhancedPage() {
  return (
    <EnhancedSimulatorToolPage
      title="Calculateur Brut/Net Amélioré"
      description="Calcul du salaire brut/net avec situation familiale et avantages légaux."
      apiPath="/api/simulate/net-gross-enhanced"
      calculatorType="net_gross_enhanced"
      fields={[
        { 
          key: "direction", 
          label: "Type de calcul", 
          type: "select", 
          defaultValue: "gross_to_net",
          options: [
            { value: "gross_to_net", label: "Brut vers Net" },
            { value: "net_to_gross", label: "Net vers Brut" }
          ]
        },
        { 
          key: "amount", 
          label: "Montant (MAD)", 
          type: "number", 
          defaultValue: "9000", 
          min: 0, 
          step: 0.01 
        },
        { 
          key: "familySituation", 
          label: "Situation familiale", 
          type: "select", 
          defaultValue: "single",
          options: [
            { value: "single", label: "Célibataire" },
            { value: "married", label: "Marié(e)" },
            { value: "married_with_children", label: "Marié(e) avec enfants" },
            { value: "divorced", label: "Divorcé(e)" },
            { value: "widowed", label: "Veuf(ve)" }
          ]
        },
        { 
          key: "dependentChildren", 
          label: "Enfants à charge", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          max: 10 
        },
        { 
          key: "disabledChildren", 
          label: "Enfants handicapés à charge", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          max: 10 
        },
        { 
          key: "elderlyDependents", 
          label: "Personnes âgées à charge", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          max: 5 
        },
        { 
          key: "transportAllowance", 
          label: "Indemnité de transport (MAD/mois)", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          step: 0.01 
        },
        { 
          key: "accommodationAllowance", 
          label: "Indemnité de logement (MAD/mois)", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          step: 0.01 
        },
        { 
          key: "benefitsInNature", 
          label: "Avantages en nature", 
          type: "select", 
          defaultValue: "none",
          options: [
            { value: "none", label: "Aucun" },
            { value: "housing", label: "Logement" },
            { value: "vehicle", label: "Véhicule" },
            { value: "meals", label: "Repas" },
            { value: "mixed", label: "Mixte" }
          ]
        },
        { 
          key: "benefitsInNatureAmount", 
          label: "Valeur des avantages en nature (MAD/mois)", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          step: 0.01 
        },
        { 
          key: "regionCode", 
          label: "Région", 
          type: "select", 
          defaultValue: "national",
          options: [
            { value: "national", label: "National" },
            { value: "grand_casablanca", label: "Grand Casablanca" },
            { value: "rabat_sale", label: "Rabat-Salé" },
            { value: "oriental", label: "Oriental" },
            { value: "marrakech_safi", label: "Marrakech-Safi" },
            { value: "souss_massa", label: "Souss-Massa" }
          ]
        },
        { 
          key: "professionalExpensesOption", 
          label: "Frais professionnels", 
          type: "select", 
          defaultValue: "standard",
          options: [
            { value: "standard", label: "Déduction standard (20%)" },
            { value: "actual", label: "Frais réels" }
          ]
        },
        { 
          key: "actualProfessionalExpenses", 
          label: "Montant des frais professionnels réels (MAD/an)", 
          type: "number", 
          defaultValue: 0, 
          min: 0, 
          step: 0.01 
        },
        { 
          key: "includeCimr", 
          label: "Cotisation CIMR", 
          type: "checkbox", 
          defaultValue: false 
        },
        { 
          key: "cimrRate", 
          label: "Taux CIMR (%)", 
          type: "number", 
          defaultValue: 6, 
          min: 0, 
          max: 20, 
          step: 0.1 
        },
        { 
          key: "calculationDate", 
          label: "Date de calcul", 
          type: "date", 
          defaultValue: "2026-03-31" 
        },
      ]}
      breakdownLabels={{
        grossSalary: "Salaire brut",
        netSalary: "Salaire net",
        cnssEmployee: "CNSS employé",
        cnssEmployer: "CNSS employeur", 
        amoEmployee: "AMO employé",
        amoEmployer: "AMO employeur",
        professionalDeduction: "Déduction professionnelle",
        taxableIncome: "Revenu taxable",
        incomeTax: "Impôt sur le revenu",
        cimrEmployee: "CIMR employé",
        employerTotalCost: "Coût total employeur",
        effectiveTaxRate: "Taux effectif d'imposition",
        netToGrossRatio: "Ratio Net/Brut"
      }}
      units={{
        grossSalary: "MAD",
        netSalary: "MAD",
        cnssEmployee: "MAD",
        cnssEmployer: "MAD",
        amoEmployee: "MAD", 
        amoEmployer: "MAD",
        professionalDeduction: "MAD",
        taxableIncome: "MAD",
        incomeTax: "MAD",
        cimrEmployee: "MAD",
        employerTotalCost: "MAD",
        effectiveTaxRate: "%",
        netToGrossRatio: "%"
      }}
    />
  );
}
