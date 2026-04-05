"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import type { ToolPolicy } from "@/lib/tools/tool-catalog";
import { useMemo, useState } from "react";

export default function ToolsIndexPage() {
  const { t, language } = useLanguage();
  const { config } = usePublicConfig();
  const toolPolicies = config.toolPolicies as Record<string, ToolPolicy>;
  const userAuthenticated = config.userAuthenticated;

  const tools = [
    {
      id: "payslip_detector",
      href: "/outils/detecteur-fiche-paie",
      title: t("toolsPage.payslipTitle"),
      description: t("toolsPage.payslipDesc"),
    },
    {
      id: "salary_delay_alert",
      href: "/outils/alerte-retard-salaire",
      title: t("toolsPage.delayTitle"),
      description: t("toolsPage.delayDesc"),
    },
    {
      id: "compliance_risk_score",
      href: "/outils/score-risque-conformite",
      title: t("toolsPage.complianceTitle"),
      description: t("toolsPage.complianceDesc"),
    },
    {
      id: "final_settlement_audit",
      href: "/outils/audit-solde-tout-compte",
      title: t("toolsPage.finalSettlementTitle"),
      description: t("toolsPage.finalSettlementDesc"),
    },
    {
      id: "disciplinary_procedure_check",
      href: "/outils/controle-procedure-disciplinaire",
      title: t("toolsPage.disciplineTitle"),
      description: t("toolsPage.disciplineDesc"),
    },
    {
      id: "fixed_term_contract_risk",
      href: "/outils/risque-requalification-cdd",
      title: t("toolsPage.cddRiskTitle"),
      description: t("toolsPage.cddRiskDesc"),
    },
    {
      id: "pre_litigation_timeline",
      href: "/outils/feuille-route-pre-contentieux",
      title: t("toolsPage.timelineTitle"),
      description: t("toolsPage.timelineDesc"),
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    const visibleTools = tools.filter((tool) => resolveToolPolicy(toolPolicies, tool.id).visible);
    if (!searchQuery.trim()) return visibleTools;
    
    const query = searchQuery.toLowerCase();
    return visibleTools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
  }, [searchQuery, toolPolicies, tools]);

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("toolsPage.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold sm:text-5xl">{t("toolsPage.title")}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{t("toolsPage.description")}</p>
          <div className="mt-6">
            <div className="relative max-w-xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="h-5 w-5 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("common.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-3.5 pl-11 pr-4 text-sm font-medium focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => {
              const policy = resolveToolPolicy(toolPolicies, tool.id);
              const usable = canUseTool(policy, userAuthenticated);
              if (usable) {
                return (
                  <Link key={tool.href} href={tool.href} className="soft-card min-w-0 rounded-3xl p-5 group">
                    <h2 className="display-font break-words text-2xl font-semibold group-hover:text-[var(--accent)] transition-colors">{tool.title}</h2>
                    <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{tool.description}</p>
                  </Link>
                );
              }
              return (
                <article key={tool.href} className="soft-card min-w-0 rounded-3xl p-5 opacity-80">
                  <h2 className="display-font break-words text-2xl font-semibold">{tool.title}</h2>
                  <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{tool.description}</p>
                  <p className="mt-3 break-words text-xs text-[var(--ink-soft)]">
                    {policy.enabled ? "Reserve aux utilisateurs connectes." : "Desactive par administration."}
                  </p>
                </article>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center soft-card rounded-[2rem]">
              <p className="text-[var(--ink-soft)]">{t("common.noResults", { query: searchQuery })}</p>
            </div>
          )}
        </section>

        {/* Related Simulators Section */}
        <section className="mt-8">
          <p className="section-kicker pl-1">{t("toolsPage.relatedSimulators")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/simulateurs/licenciement" className="soft-card min-w-0 rounded-3xl p-5">
              <h2 className="display-font break-words text-xl font-semibold">
                {language === "ar" ? "تعويض الفصل" : "Indemnité Licenciement"}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {language === "ar" ? "تقدير التعويض القانوني والإشعار والعطل المتبقية." : "Estimation indemnité légale, préavis, congés restants."}
              </p>
            </Link>
            <Link href="/simulateurs/heures-supplementaires" className="soft-card min-w-0 rounded-3xl p-5">
              <h2 className="display-font break-words text-xl font-semibold">
                {language === "ar" ? "الساعات الإضافية" : "Heures Supplémentaires"}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {language === "ar" ? "احسب الزيادات القانونية والساعات المستحقة." : "Calculez les majorations légales et heures dues."}
              </p>
            </Link>
            <Link href="/simulateurs/recouvrement-salaire-impaye" className="soft-card min-w-0 rounded-3xl p-5">
              <h2 className="display-font break-words text-xl font-semibold">
                {language === "ar" ? "استرداد الأجر غير المدفوع" : "Recouvrement Salaire Impayé"}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {language === "ar" ? "تقدير الأصل والغرامات المستحقة." : "Estimez le principal et les pénalités dus."}
              </p>
            </Link>
          </div>
        </section>

        {/* Cross-section Links */}
        <section className="mt-12 border-t border-[var(--line)] pt-12">
          <p className="section-kicker text-center">{t("common.exploreSections")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Link href="/simulateurs" className="soft-card group rounded-[2rem] p-6 transition-all hover:-translate-y-1">
              <p className="section-kicker">{t("nav.simulate")}</p>
              <h3 className="display-font mt-2 text-xl font-bold">{language === "ar" ? "محاكاة الحقوق" : "Simulateurs Calcul"}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{t("common.simulateDesc")}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-[var(--accent)] group-hover:underline">
                {t("common.explore")} &rarr;
              </div>
            </Link>
            <Link href="/planifier" className="soft-card group rounded-[2rem] p-6 transition-all hover:-translate-y-1">
              <p className="section-kicker">{t("nav.plan")}</p>
              <h3 className="display-font mt-2 text-xl font-bold">{language === "ar" ? "تخطيط مستقبلي" : "Planification Pro"}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{t("common.planifierDesc")}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-[var(--accent)] group-hover:underline">
                {t("common.explore")} &rarr;
              </div>
            </Link>
            <Link href="/documents" className="soft-card group rounded-[2rem] p-6 transition-all hover:-translate-y-1">
              <p className="section-kicker">{t("nav.documents")}</p>
              <h3 className="display-font mt-2 text-xl font-bold">{language === "ar" ? "نماذج قانونية" : "Modèles Docs"}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{t("common.documentsDesc")}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-[var(--accent)] group-hover:underline">
                {t("common.explore")} &rarr;
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
