"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import type { ToolPolicy } from "@/lib/tools/tool-catalog";

export default function ToolsIndexPage() {
  const { t } = useLanguage();
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

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("toolsPage.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-4xl font-semibold sm:text-5xl">{t("toolsPage.title")}</h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">{t("toolsPage.description")}</p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools
            .filter((tool) => resolveToolPolicy(toolPolicies, tool.id).visible)
            .map((tool) => {
              const policy = resolveToolPolicy(toolPolicies, tool.id);
              const usable = canUseTool(policy, userAuthenticated);
              if (usable) {
                return (
                  <Link key={tool.href} href={tool.href} className="soft-card min-w-0 rounded-3xl p-5">
                    <h2 className="display-font break-words text-2xl font-semibold">{tool.title}</h2>
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
            })}
        </section>
      </div>
    </main>
  );
}
