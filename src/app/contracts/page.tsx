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

  // Contract generator page - v1.0.2 - Production ready

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
          setError(data.error || t('contractsPage.errorLoading'));
        }
      } catch (err) {
        setError(t('contractsPage.networkError'));
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
          templateId: contractData.contract_type.toUpperCase(),
          contractData
        }),
      });

      const result = await response.json();

      if (result.ok) {
        const content = result.contract.content;
        const contractType = contractData.contract_type === 'CDI' 
          ? 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)'
          : 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)';
        
        // Professional HTML formatted for print-to-PDF
        const pdfWindow = window.open('', '', 'width=950,height=1200');
        if (pdfWindow) {
          // Escape content for safe HTML insertion
          const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          pdfWindow.document.write(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Contrat de Travail</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Cambria', 'Times New Roman', serif;
                  line-height: 1.5;
                  color: #1a1a1a;
                  background: white;
                }
                
                .page {
                  width: 21cm;
                  height: 29.7cm;
                  margin: 0 auto;
                  padding: 1.5cm;
                  background: white;
                }
                
                .header {
                  text-align: center;
                  border-bottom: 3px solid #000;
                  padding-bottom: 0.8cm;
                  margin-bottom: 0.8cm;
                }
                
                .brand {
                  font-size: 12pt;
                  font-weight: bold;
                  letter-spacing: 2px;
                  margin-bottom: 0.2cm;
                }
                
                .tagline {
                  font-size: 9pt;
                  color: #555;
                  margin-bottom: 0.5cm;
                }
                
                .title {
                  text-align: center;
                  font-size: 16pt;
                  font-weight: bold;
                  text-decoration: underline;
                  margin: 1cm 0 0.5cm 0;
                }
                
                .intro {
                  text-align: center;
                  font-size: 10pt;
                  margin-bottom: 1cm;
                  font-style: italic;
                }
                
                .parties {
                  font-size: 10pt;
                  margin-bottom: 1cm;
                  line-height: 1.8;
                }
                
                .party {
                  margin-bottom: 0.5cm;
                }
                
                .party-label {
                  font-weight: bold;
                  text-decoration: underline;
                }
                
                .divider {
                  border-top: 2px solid #000;
                  margin: 1cm 0;
                }
                
                .preamble {
                  text-align: center;
                  font-weight: bold;
                  font-size: 11pt;
                  margin: 1cm 0;
                }
                
                .content {
                  font-size: 10pt;
                  line-height: 1.7;
                  text-align: justify;
                  white-space: pre-wrap;
                  word-break: break-word;
                  font-family: 'Cambria', 'Times New Roman', serif;
                }
                
                .footer {
                  border-top: 1px solid #ccc;
                  margin-top: 1.5cm;
                  padding-top: 0.5cm;
                  font-size: 8pt;
                  color: #666;
                  text-align: center;
                  line-height: 1.6;
                }
                
                @media print {
                  body { margin: 0; padding: 0; }
                  .page { width: 100%; height: auto; margin: 0; padding: 1.5cm; }
                }
              </style>
            </head>
            <body>
              <div class="page">
                <div class="header">
                  <div class="brand">MONRH</div>
                  <div class="tagline">Plateforme de Droit du Travail au Maroc</div>
                </div>
                
                <div class="title">${contractType}</div>
                
                <div class="content">${escapedContent}</div>
                
                <div class="footer">
                  <div>Conforme au Code du Travail Marocain (Loi 65-99)</div>
                  <div>Document généré automatiquement par MONRH</div>
                  <div>Date: ${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
              
              <script>
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    window.print();
                  }, 500);
                });
              </script>
            </body>
            </html>
          `);
          pdfWindow.document.close();
        }
      } else {
        alert(result.error || t('contractsPage.errorLoading'));
      }
    } catch (err) {
      alert(t('contractsPage.networkError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('contractsPage.loading')}</p>
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
            {t('contractsPage.retry')}
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
            {t('contractsPage.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('contractsPage.description')}
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
            {t('contractsPage.footer')}
          </p>
        </div>
      </div>
    </main>
  );
}
