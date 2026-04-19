"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/components/language-provider";
import { ContractWizard } from "@/components/contract-wizard";
import { AdSlot } from "@/components/ad-slot";
import type {
  ContractTemplate,
  ContractClause,
  ContractFormData,
  ContractPreview,
} from "@/lib/contracts/types";

type ContractApiPayload = {
  ok: boolean;
  templates?: ContractTemplate[];
  clauses?: ContractClause[];
  validationRules?: any[];
  error?: string;
};

type GeneratedContract = {
  id: string;
  content: string;
  warnings?: { field: string; message: string }[];
};

export default function ContratPage() {
  const { t, language } = useLanguage();

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [validationRules, setValidationRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Post-generation state
  const [generatedContract, setGeneratedContract] = useState<GeneratedContract | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contracts/templates", { cache: "no-store" });
      const data: ContractApiPayload = await res.json();
      if (!data.ok || !data.templates) {
        throw new Error(data.error ?? t("contractsPage.errorLoading"));
      }
      setTemplates(data.templates);
      setClauses(data.clauses ?? []);
      setValidationRules(data.validationRules ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("contractsPage.networkError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleGenerate = async (formData: ContractFormData) => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: formData.contract_type,
          contractData: formData,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? "Erreur de génération");
      }
      setGeneratedContract(data.contract);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedContract) return;
    // For now, still text, but with better naming and encoding
    const blob = new Blob([generatedContract.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `contrat_monrh_${generatedContract.id.slice(0, 8)}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!generatedContract) return;
    
    // Securely determine title
    const isCDI = generatedContract.content.includes("DURÉE INDÉTERMINÉE") || generatedContract.content.includes("CDI");
    const contractTitle = isCDI 
      ? 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)' 
      : 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)';

    // Escape content for safe HTML insertion
    const escapedContent = generatedContract.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Impression Contrat - MONRH</title>
        <style>
          @page { size: A4; margin: 2.5cm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: "Cambria", "Times New Roman", serif; 
            line-height: 1.6; 
            color: #1a1a1a; 
            background: white;
            padding: 2cm;
            max-width: 21cm;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 1cm; 
            margin-bottom: 1.5cm; 
          }
          .brand { font-size: 20pt; font-weight: bold; letter-spacing: 4px; color: #000; }
          .tagline { font-size: 10pt; color: #666; margin-top: 5px; font-style: italic; }
          .title { 
            text-align: center; 
            font-size: 16pt; 
            font-weight: bold; 
            text-decoration: underline; 
            margin: 2cm 0 1cm 0; 
            text-transform: uppercase;
          }
          .content { 
            font-size: 11pt; 
            white-space: pre-wrap; 
            text-align: justify; 
            font-family: inherit;
          }
          .footer { 
            margin-top: 3cm; 
            padding-top: 0.5cm; 
            border-top: 1px solid #eee;
            font-size: 9pt; 
            color: #777; 
            text-align: center; 
          }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">MONRH</div>
          <div class="tagline">Solutions de Gestion des Ressources Humaines au Maroc</div>
        </div>
        <div class="title">${contractTitle}</div>
        <div class="content">${escapedContent}</div>
        <div class="footer">
          <div>Document généré via la plateforme MONRH.ma</div>
          <div style="margin-top: 4px;">Conforme au Code du Travail Marocain (Loi 65-99)</div>
        </div>
        <script>
            setTimeout(function() { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setGeneratedContract(null);
    setGenerateError(null);
  };

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="soft-card rounded-[2rem] p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
            <p className="text-sm text-[var(--ink-soft)]">{t("contractsPage.loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="soft-card rounded-[2rem] p-8 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-[var(--ink-soft)]">{error}</p>
            <button onClick={fetchTemplates} className="btn-primary px-6 py-2 text-sm">
              {t("contractsPage.retry")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Generated Contract View ─────────────────────────────────────────────────
  if (generatedContract) {
    return (
      <main className="paper-bg min-h-screen max-w-full overflow-x-hidden pb-24">
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          {/* Success Header */}
          <section className="soft-card rounded-[2rem] p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="section-kicker">Contrat généré</p>
                <h1 className="display-font mt-1 text-3xl font-semibold text-[var(--foreground)]">
                  Votre contrat est prêt
                </h1>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Contrat ID: <code className="font-mono text-xs">{generatedContract.id}</code>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDownload}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Télécharger (.txt)
                </button>
                <button
                  onClick={handlePrint}
                  className="panel-tonal flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Imprimer
                </button>
                <button
                  onClick={handleReset}
                  className="panel-tonal flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition"
                >
                  Nouveau contrat
                </button>
              </div>
            </div>

            {/* Warnings */}
            {generatedContract.warnings && generatedContract.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {generatedContract.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <span>⚠️</span>
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Contract Content Preview */}
          <section className="soft-card rounded-[2rem] p-6 sm:p-8 mb-6">
            <h2 className="display-font text-xl font-semibold text-[var(--foreground)] mb-4">
              Aperçu du contrat
            </h2>
            <div className="panel-tonal max-h-[70vh] overflow-y-auto rounded-2xl p-6">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--foreground)]">
                {generatedContract.content}
              </pre>
            </div>
          </section>

          {/* Ad Slot */}
          <section className="soft-card mt-5 rounded-3xl p-3">
            <AdSlot slot="8888888888" format="auto" />
          </section>

          {/* Legal Disclaimer */}
          <p className="mt-6 text-center text-xs text-[var(--ink-soft)]">
            {t("contractsPage.footer")}
          </p>
        </div>
      </main>
    );
  }

  // ─── Main Wizard View ────────────────────────────────────────────────────────
  return (
    <main className="paper-bg min-h-screen max-w-full overflow-x-hidden pb-24" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">

        {/* Page Header */}
        <section className="soft-card mb-6 rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">
            {language === "ar" ? "مولّد العقود" : "Contract Factory"}
          </p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold leading-tight sm:text-5xl text-[var(--foreground)]">
            {t("contractsPage.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {t("contractsPage.description")}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <article className="panel-tonal rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {language === "ar" ? "Ù…Ù†ØªØ¬ Ø§Ù„Ø¹Ù‚Ø¯" : "Cadre"}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">CDI + CDD</p>
            </article>
            <article className="panel-tonal rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {language === "ar" ? "Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡" : "Parcours"}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">8 etapes</p>
            </article>
            <article className="panel-tonal rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {language === "ar" ? "Ø§Ù„Ù…Ø·Ø§Ø¨Ù‚Ø©" : "Conformite"}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">Loi 65-99</p>
            </article>
          </div>

          {/* Feature Badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              language === "ar" ? "CDI • CDD" : "CDI • CDD",
              language === "ar" ? "8 خطوات موجهة" : "8 étapes guidées",
              language === "ar" ? "بدون ذكاء اصطناعي" : "Sans IA — 100% déterministe",
              language === "ar" ? "القانون رقم 65-99" : "Loi 65-99",
              language === "ar" ? "حفظ تلقائي للمسودة" : "Brouillon auto-sauvegardé",
            ].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-full bg-[var(--juris-surface-low)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]"
              >
                {badge}
              </span>
            ))}
          </div>
        </section>

        {/* Generation Error */}
        {generateError && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
            <span>❌</span>
            <span>{generateError}</span>
          </div>
        )}

        {/* Generating spinner overlay */}
        {generating && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent)]/5 px-5 py-4 text-sm text-[var(--accent)]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <span>Génération du contrat en cours...</span>
          </div>
        )}

        {/* No templates warning */}
        {templates.length === 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
            <p className="font-semibold mb-1">⚠️ Base de données non initialisée</p>
            <p>Les modèles de contrats ne sont pas encore chargés dans Supabase.
              Lancez le seed via <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 px-1 rounded">POST /api/contracts/seed</code> pour les initialiser.</p>
          </div>
        )}

        {/* Wizard */}
        <div className="soft-card rounded-[2rem] p-4 sm:p-8">
          <ContractWizard
            templates={templates}
            clauses={clauses}
            validationRules={validationRules}
            onGenerate={handleGenerate}
          />
        </div>

        {/* How it works */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: "📝",
              title: language === "ar" ? "أدخل بياناتك" : "Remplissez vos données",
              desc: language === "ar"
                ? "معلومات الموظف والمشغل والمنصب والراتب"
                : "Informations employé, employeur, poste et salaire",
            },
            {
              icon: "⚙️",
              title: language === "ar" ? "اختر البنود" : "Choisissez vos clauses",
              desc: language === "ar"
                ? "سرية، منافسة، تنقل، عمل عن بعد..."
                : "Confidentialité, non-concurrence, mobilité, télétravail...",
            },
            {
              icon: "📄",
              title: language === "ar" ? "احصل على العقد" : "Obtenez le contrat",
              desc: language === "ar"
                ? "وثيقة جاهزة للتوقيع متوافقة مع القانون المغربي"
                : "Document prêt à signer, conforme au droit marocain",
            },
          ].map((step) => (
            <div key={step.title} className="panel-tonal rounded-[1.4rem] p-5">
              <div className="mb-3 text-3xl">{step.icon}</div>
              <h3 className="font-semibold text-[var(--foreground)]">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{step.desc}</p>
            </div>
          ))}
        </section>

        {/* Ad Slot */}
        <section className="mt-5 soft-card rounded-3xl p-3">
          <AdSlot slot="8888888888" format="auto" />
        </section>

        {/* Legal Footer */}
        <p className="mt-6 text-center text-xs text-[var(--ink-soft)]">
          {t("contractsPage.footer")}
        </p>
      </div>
    </main>
  );
}
