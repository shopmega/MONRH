"use client";

import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
import { canUseTool, resolveToolPolicy } from "@/lib/tools/tool-access";
import type { ToolPolicy } from "@/lib/tools/tool-catalog";
import { useMemo, useState } from "react";

type SimulatorItem = {
  title: { fr: string; ar: string };
  description: { fr: string; ar: string };
  href: string;
};

type SimulatorGroup = {
  titleKey: string;
  subtitleKey: string;
  items: SimulatorItem[];
};

const simulatorGroups: SimulatorGroup[] = [
  {
    titleKey: "simulatePage.groupSalaryTitle",
    subtitleKey: "simulatePage.groupSalarySubtitle",
    items: [
      {
        title: { fr: "Net <-> Brut", ar: "الصافي <-> الإجمالي" },
        description: {
          fr: "Calculez salaire net, charges et cout employeur selon la date legale.",
          ar: "احسب الأجر الصافي والاقتطاعات وكلفة المشغل حسب التاريخ القانوني.",
        },
        href: "/simulateurs/brut-net",
      },
      {
        title: { fr: "Cout Total Employeur", ar: "الكلفة الإجمالية للمشغل" },
        description: {
          fr: "Projection du cout mensuel complet pour l'entreprise.",
          ar: "تقدير الكلفة الشهرية الإجمالية على الشركة.",
        },
        href: "/simulateurs/cout-employeur-total",
      },
      {
        title: { fr: "IR Annuel", ar: "الضريبة السنوية" },
        description: {
          fr: "Vue annualisee avec bonus, 13e mois et taux effectif.",
          ar: "عرض سنوي يشمل المنح والشهر 13 والمعدل الفعلي.",
        },
        href: "/simulateurs/ir-annuel",
      },
    ],
  },
  {
    titleKey: "simulatePage.groupTerminationTitle",
    subtitleKey: "simulatePage.groupTerminationSubtitle",
    items: [
      {
        title: { fr: "Indemnite Licenciement", ar: "تعويض الفصل" },
        description: {
          fr: "Estimation indemnite legale, preavis, conges restants et scenario abusif.",
          ar: "تقدير التعويض القانوني والإشعار والعطل المتبقية وسيناريو التعسف.",
        },
        href: "/simulateurs/licenciement",
      },
      {
        title: { fr: "Scenario Demission", ar: "سيناريو الاستقالة" },
        description: {
          fr: "Impact financier de la demission avec/sans execution du preavis.",
          ar: "الأثر المالي للاستقالة مع أو بدون تنفيذ الإشعار.",
        },
        href: "/simulateurs/demission",
      },
      {
        title: { fr: "Duree de Preavis", ar: "مدة الإشعار" },
        description: {
          fr: "Calculez la duree legale de preavis selon contrat, categorie et anciennete.",
          ar: "احسب المدة القانونية للإشعار حسب العقد والفئة والأقدمية.",
        },
        href: "/simulateurs/duree-preavis",
      },
      {
        title: { fr: "Fin de CDD", ar: "نهاية عقد CDD" },
        description: {
          fr: "Prime de precarite, conges restants et compensation preavis.",
          ar: "منحة الهشاشة والعطل المتبقية وتعويض الإشعار.",
        },
        href: "/simulateurs/fin-cdd",
      },
      {
        title: { fr: "Rupture en Periode d'Essai", ar: "إنهاء فترة التجربة" },
        description: {
          fr: "Controle des delais de preavis et compensation associee.",
          ar: "التحقق من آجال الإشعار والتعويض المرتبط بها.",
        },
        href: "/simulateurs/rupture-periode-essai",
      },
      {
        title: { fr: "Croissance Anciennete", ar: "تطور الأقدمية" },
        description: {
          fr: "Comparez l'indemnite potentielle aujourd'hui vs plus tard.",
          ar: "قارن التعويض المحتمل اليوم مقابل سنوات إضافية.",
        },
        href: "/simulateurs/progression-anciennete",
      },
    ],
  },
  {
    titleKey: "simulatePage.groupTimeTitle",
    subtitleKey: "simulatePage.groupTimeSubtitle",
    items: [
      {
        title: { fr: "Conges Acquis", ar: "العطل المكتسبة" },
        description: {
          fr: "Simulation mensuelle des conges payes, bonus anciennete et reliquat.",
          ar: "محاكاة شهرية للعطل المؤدى عنها مع مكافأة الأقدمية والرصد المتبقي.",
        },
        href: "/simulateurs/acquisition-conges",
      },
      {
        title: { fr: "Conformite SMIG / SMAG", ar: "مطابقة SMIG / SMAG" },
        description: {
          fr: "Controle rapide du minimum legal et ecart de conformite.",
          ar: "فحص سريع للحد الأدنى القانوني وفارق المطابقة.",
        },
        href: "/simulateurs/conformite-smig",
      },
      {
        title: { fr: "Heures Supplementaires", ar: "الساعات الإضافية" },
        description: {
          fr: "Calculez les majorations jour, nuit, weekend et jours feries.",
          ar: "احسب الزيادات لساعات النهار والليل وعطلة الأسبوع والأعياد.",
        },
        href: "/simulateurs/heures-supplementaires",
      },
      {
        title: { fr: "Travail Jour Ferie", ar: "العمل في يوم عطلة" },
        description: {
          fr: "Compensation dediee pour heures realisees en jour ferie.",
          ar: "تعويض خاص عن الساعات المنجزة خلال يوم عطلة.",
        },
        href: "/simulateurs/compensation-jours-feries",
      },
      {
        title: { fr: "Conge Maternite", ar: "عطلة الأمومة" },
        description: {
          fr: "Estimation de revenu CNSS et complement employeur.",
          ar: "تقدير تعويض CNSS وتكملة المشغل.",
        },
        href: "/simulateurs/conge-maternite",
      },
      {
        title: { fr: "Arret Maladie", ar: "التوقف المرضي" },
        description: {
          fr: "Impact financier d'un arret avec delai de carence.",
          ar: "الأثر المالي للتوقف المرضي مع فترة انتظار.",
        },
        href: "/simulateurs/conge-maladie",
      },
      {
        title: { fr: "Projection Pension CNSS", ar: "توقع معاش CNSS" },
        description: {
          fr: "Projection simplifiee selon salaire moyen et annees cotisees.",
          ar: "توقع مبسط حسب متوسط الأجر وسنوات الاشتراك.",
        },
        href: "/simulateurs/pension-cnss",
      },
      {
        title: { fr: "Accident du Travail", ar: "حادثة شغل" },
        description: {
          fr: "Estimation indemnisation temporaire et permanente.",
          ar: "تقدير التعويض المؤقت والدائم.",
        },
        href: "/simulateurs/accident-travail",
      },
    ],
  },
  {
    titleKey: "simulatePage.groupDisputeTitle",
    subtitleKey: "simulatePage.groupDisputeSubtitle",
    items: [
      {
        title: { fr: "Scenario Harcelement", ar: "سيناريو التحرش" },
        description: {
          fr: "Evaluation de preparation du dossier et niveau d'escalade.",
          ar: "تقييم جاهزية الملف ومستوى التصعيد.",
        },
        href: "/simulateurs/scenario-harcelement",
      },
      {
        title: { fr: "Recouvrement Salaire Impaye", ar: "تحصيل الأجر غير المؤدى" },
        description: {
          fr: "Principal + penalites de retard pour reclamation.",
          ar: "المبلغ الأصلي مع غرامات التأخير للمطالبة.",
        },
        href: "/simulateurs/recouvrement-salaire-impaye",
      },
      {
        title: { fr: "Recouvrement Heures Sup", ar: "تحصيل الساعات الإضافية" },
        description: {
          fr: "Estimation des heures sup impayees et penalites associees.",
          ar: "تقدير الساعات الإضافية غير المؤداة والغرامات المرتبطة.",
        },
        href: "/simulateurs/recouvrement-heures-supplementaires",
      },
    ],
  },
];

const TOOL_ID_BY_HREF: Record<string, string> = {
  "/simulateurs/brut-net": "net_gross",
  "/simulateurs/cout-employeur-total": "employer_total_cost",
  "/simulateurs/ir-annuel": "annual_income_tax",
  "/simulateurs/licenciement": "licenciement",
  "/simulateurs/demission": "demission",
  "/simulateurs/duree-preavis": "duree_preavis",
  "/simulateurs/fin-cdd": "fin_cdd",
  "/simulateurs/rupture-periode-essai": "probation_termination",
  "/simulateurs/progression-anciennete": "seniority_growth",
  "/simulateurs/acquisition-conges": "leave_accrual",
  "/simulateurs/conformite-smig": "smig_compliance",
  "/simulateurs/heures-supplementaires": "overtime",
  "/simulateurs/compensation-jours-feries": "public_holiday_compensation",
  "/simulateurs/conge-maternite": "maternity_leave",
  "/simulateurs/conge-maladie": "sick_leave",
  "/simulateurs/pension-cnss": "cnss_pension",
  "/simulateurs/accident-travail": "work_accident",
  "/simulateurs/scenario-harcelement": "harassment_scenario",
  "/simulateurs/recouvrement-salaire-impaye": "unpaid_salary_recovery",
  "/simulateurs/recouvrement-heures-supplementaires": "unpaid_overtime_recovery",
};

function toolIdFromHref(href: string): string {
  return TOOL_ID_BY_HREF[href] ?? href.split("/").filter(Boolean).pop()?.replaceAll("-", "_") ?? href;
}

export default function SimulatePage() {
  const { t, language } = useLanguage();
  const { config } = usePublicConfig();
  const toolPolicies = config.toolPolicies as Record<string, ToolPolicy>;
  const userAuthenticated = config.userAuthenticated;

  const visibleGroups = useMemo(
    () =>
      simulatorGroups
        .map((group: SimulatorGroup) => ({
          ...group,
          items: group.items.filter((item: SimulatorItem) => resolveToolPolicy(toolPolicies, toolIdFromHref(item.href)).visible),
        }))
        .filter((group) => group.items.length > 0),
    [toolPolicies],
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return visibleGroups;
    
    const query = searchQuery.toLowerCase();
    return visibleGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.title.fr.toLowerCase().includes(query) ||
            item.title.ar.toLowerCase().includes(query) ||
            item.description.fr.toLowerCase().includes(query) ||
            item.description.ar.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleGroups, searchQuery]);

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("simulatePage.kicker")}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            {t("simulatePage.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {t("simulatePage.description")}
          </p>
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

        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="5555555555" format="auto" />
          </div>
        </section>

        <div className="mt-5 space-y-5">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group, groupIndex) => (
              <section
                key={group.titleKey}
                className={`rounded-3xl p-5 ${groupIndex % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
              >
                <div className="mb-4">
                  <p className="section-kicker">{t(group.titleKey)}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {t(group.subtitleKey)} ({t("simulatePage.toolsCount", { count: group.items.length })})
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item, index) => (
                    <article
                      key={item.href}
                      className={`rounded-2xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
                    >
                      <h2 className="display-font text-xl font-semibold leading-tight">{item.title[language]}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.description[language]}</p>
                      {canUseTool(resolveToolPolicy(toolPolicies, toolIdFromHref(item.href)), userAuthenticated) ? (
                        <Link href={item.href} className="btn-primary mt-4 px-4 py-2 text-sm">
                          {t("common.open")}
                        </Link>
                      ) : (
                        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-soft)]">
                          {resolveToolPolicy(toolPolicies, toolIdFromHref(item.href)).enabled
                            ? "Reserve aux utilisateurs connectes."
                            : "Desactive par administration."}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="soft-card flex flex-col items-center justify-center rounded-[2rem] p-12 text-center">
              <svg className="mb-4 h-12 w-12 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold text-[var(--foreground)]">{t("common.noResults", { query: searchQuery })}</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm font-bold text-[var(--accent)] hover:underline"
              >
                {language === "ar" ? "مسح البحث" : "Effacer la recherche"}
              </button>
            </section>
          )}
        </div>

        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="6666666666" format="auto" />
          </div>
        </section>

        {/* Protection Tools Section */}
        <section className="mt-8">
          <p className="section-kicker pl-1">{t("simulatePage.relatedTools")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/outils/detecteur-fiche-paie" className="soft-card min-w-0 rounded-3xl p-5">
              <h2 className="display-font break-words text-xl font-semibold">
                {language === "ar" ? "كاشف ورقة الأجر" : "Détecteur de fiche de paie"}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {language === "ar" ? "تحقق من مطابقة كشف الأجر والاقتطاعات." : "Vérifiez la cohérence de votre bulletin et des retenues."}
              </p>
            </Link>
            <Link href="/outils/audit-solde-tout-compte" className="soft-card min-w-0 rounded-3xl p-5">
              <h2 className="display-font break-words text-xl font-semibold">
                {language === "ar" ? "مراجعة تسوية كل الحسابات" : "Audit solde de tout compte"}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {language === "ar" ? "تقدير المبالغ المستحقة في التسوية النهائية." : "Estimez les montants qui devraient apparaître dans votre solde final."}
              </p>
            </Link>
            <Link href="/outils/feuille-route-pre-contentieux" className="soft-card min-w-0 rounded-3xl p-5">
              <h2 className="display-font break-words text-xl font-semibold">
                {language === "ar" ? "خريطة طريق ما قبل النزاع" : "Feuille route pré-contentieux"}
              </h2>
              <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
                {language === "ar" ? "خطة عمل قبل رفع دعوى قضائية." : "Obtenez un plan d'action avant saisine judiciaire."}
              </p>
            </Link>
          </div>
        </section>

        {/* Cross-section Links */}
        <section className="mt-12 border-t border-[var(--line)] pt-12">
          <p className="section-kicker text-center">{t("common.exploreSections")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Link href="/planifier" className="soft-card group rounded-[2rem] p-6 transition-all hover:-translate-y-1">
              <p className="section-kicker">{t("nav.plan")}</p>
              <h3 className="display-font mt-2 text-xl font-bold">{language === "ar" ? "تخطيط مستقبلي" : "Planification Pro"}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{t("common.planifierDesc")}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-[var(--accent)] group-hover:underline">
                {t("common.explore")} &rarr;
              </div>
            </Link>
            <Link href="/outils" className="soft-card group rounded-[2rem] p-6 transition-all hover:-translate-y-1">
              <p className="section-kicker">{t("nav.tools")}</p>
              <h3 className="display-font mt-2 text-xl font-bold">{language === "ar" ? "أدوات الحماية" : "Outils Protection"}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{t("common.toolsDesc")}</p>
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
