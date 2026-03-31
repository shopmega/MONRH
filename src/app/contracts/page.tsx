"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { ContractWizard } from "@/components/contract-wizard";
import type { ContractTemplate, ContractClause, ContractPreview } from "@/lib/contracts/types";

export default function ContractsPage() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [validationRules, setValidationRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contract generator page - v1.0.1

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contracts/templates");
        const data = await response.json();

        if (data.ok) {
          setTemplates(data.templates);
          setClauses(data.clauses);
          setValidationRules(data.validationRules);
        } else {
          setError(data.error || "Failed to load contract templates");
        }
      } catch (err) {
        setError("Network error loading contract templates");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePreview = (preview: ContractPreview) => {
    // Could show a modal or update a preview panel
    console.log("Contract preview:", preview);
  };

  const handleGenerate = async (contractData: any) => {
    try {
      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: contractData.contract_type.toUpperCase(), // Convert to uppercase to match template ID
          contractData
        }),
      });

      const result = await response.json();

      if (result.ok) {
        // Download or display the generated contract
        const blob = new Blob([result.contract.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contrat-${contractData.contract_type}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(result.error || "Failed to generate contract");
      }
    } catch (err) {
      alert("Network error generating contract");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des modèles de contrat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Générateur de Contrats
          </h1>
          <p className="text-muted-foreground">
            Créez des contrats de travail conformes au Code du travail marocain
          </p>
        </div>

        <ContractWizard
          templates={templates}
          clauses={clauses}
          validationRules={validationRules}
          onPreview={handlePreview}
          onGenerate={handleGenerate}
        />

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Conforme au Code du travail marocain • Génération déterministe • 
            Pas d'IA, uniquement des templates et règles
          </p>
        </div>
      </div>
    </main>
  );
}
