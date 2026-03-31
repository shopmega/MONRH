"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { AdSlot } from "@/components/ad-slot";

type PlanTool = {
  title: { fr: string; ar: string };
  description: { fr: string; ar: string };
  href: string;
  badge?: "new" | "pro";
  icon: string;
};

type PlanGroup = {
  titleKey: string;
  subtitleKey: string;
  items: PlanTool[];
};

const planGroups: PlanGroup[] = [
  {
    titleKey: "planifierPage.groupCompareTitle",
    subtitleKey: "planifierPage.groupCompareSubtitle",
    items: [
      {
        title: { fr: "Comparaison de Scenarios", ar: "مقارنة السيناريوهات" },
        description: {
          fr: "Comparez deux situations (offres, scenarios carriere) et generez un rapport de decision.",
          ar: "قارن بين وضعيتين (عروض، مسارات مهنية) وأنشئ تقرير قرار.",
        },
        href: "/planifier/comparaison-scenarios",
        badge: "new",
        icon: "⚖️",
      },
    ],
  },
  {
    titleKey: "planifierPage.groupSalaryTitle",
    subtitleKey: "planifierPage.groupSalarySubtitle",
    items: [
      {
        title: { fr: "Augmentation Salaire", ar: "زيادة الأجر" },
        description: {
          fr: "Gain net reel apres augmentation brute: IR, cout employeur, comparaison.",
          ar: "صافي الربح الحقيقي بعد الزيادة الإجمالية: الضريبة وكلفة المشغل.",
        },
        href: "/planifier/augmentation-salaire",
        badge: "new",
        icon: "📈",
      },
      {
        title: { fr: "Simulation Prime / Bonus", ar: "محاكاة المنحة" },
        description: {
          fr: "Net recu apres prime, pic de taxation et taux effectif reel.",
          ar: "الصافي المستلم بعد المنحة وذروة الضريبة والمعدل الفعلي.",
        },
        href: "/planifier/simulation-prime",
        badge: "new",
        icon: "🎁",
      },
      {
        title: { fr: "IGR Detail (Mensuel + Annuel)", ar: "تفصيل الضريبة على الدخل" },
        description: {
          fr: "Taux marginal vs effectif, detail par tranche, regularisation annuelle.",
          ar: "المعدل الهامشي مقابل الفعلي، التفصيل حسب الشريحة، التسوية السنوية.",
        },
        href: "/planifier/igr-detail",
        badge: "new",
        icon: "🧾",
      },
      {
        title: { fr: "Avantages en Nature", ar: "المزايا العينية" },
        description: {
          fr: "Valeur imposable des avantages (vehicule, logement, repas) et remuneration reelle.",
          ar: "القيمة الخاضعة للضريبة للمزايا (سيارة، سكن، وجبات) والأجر الحقيقي.",
        },
        href: "/planifier/avantages-nature",
        badge: "new",
        icon: "🏠",
      },
      {
        title: { fr: "Scenario Promotion", ar: "سيناريو الترقية" },
        description: {
          fr: "Gain net reel d'une promotion vs augmentation brute et cout employeur.",
          ar: "صافي مكسب الترقية مقابل الزيادة الإجمالية وكلفة المشغل.",
        },
        href: "/planifier/scenario-promotion",
        badge: "new",
        icon: "🚀",
      },
    ],
  },
  {
    titleKey: "planifierPage.groupCareerTitle",
    subtitleKey: "planifierPage.groupCareerSubtitle",
    items: [
      {
        title: { fr: "Freelance vs Salarie", ar: "مستقل مقابل أجير" },
        description: {
          fr: "Comparaison nette: salarie vs auto-entrepreneur. Seuil de rentabilite et TJM.",
          ar: "مقارنة صافية: أجير مقابل مقاول ذاتي. عتبة الربحية والأجر اليومي.",
        },
        href: "/planifier/freelance-vs-salarie",
        badge: "new",
        icon: "⚡",
      },
      {
        title: { fr: "Capacite Credit (Pret)", ar: "قدرة الاقتراض" },
        description: {
          fr: "Montant maximum empruntable selon salaire net et taux d'endettement 33%.",
          ar: "الحد الأقصى للاقتراض حسب الأجر الصافي وقاعدة 33% للتداين.",
        },
        href: "/planifier/capacite-credit",
        badge: "new",
        icon: "🏦",
      },
      {
        title: { fr: "Indemnite Chomage CNSS", ar: "تعويض البطالة CNSS" },
        description: {
          fr: "Eligibilite, montant mensuel, duree de prise en charge et plan de survie.",
          ar: "الأهلية والمبلغ الشهري ومدة التغطية والخطة المالية.",
        },
        href: "/planifier/indemnite-chomage",
        badge: "new",
        icon: "🛡️",
      },
      {
        title: { fr: "Retraite Avancee CNSS", ar: "التقاعد المتقدم CNSS" },
        description: {
          fr: "Projection de pension selon carriere, taux de remplacement et ecart a combler.",
          ar: "توقع المعاش حسب المسار المهني ونسبة الاستبدال والفجوة المالية.",
        },
        href: "/planifier/retraite-avancee",
        badge: "new",
        icon: "🌅",
      },
    ],
  },
  {
    titleKey: "planifierPage.groupHRTitle",
    subtitleKey: "planifierPage.groupHRSubtitle",
    items: [
      {
        title: { fr: "Bulletin de Paie", ar: "ورقة الأجر" },
        description: {
          fr: "Generez un bulletin de paie complet et conforme avec toutes les cotisations.",
          ar: "أنشئ ورقة أجر كاملة ومطابقة مع جميع الاقتطاعات.",
        },
        href: "/planifier/bulletin-paie",
        badge: "pro",
        icon: "📄",
      },
      {
        title: { fr: "Masse Salariale (RH)", ar: "الكتلة الأجرية" },
        description: {
          fr: "Simulez le cout total d'une equipe complete avec charges employeur.",
          ar: "احسب التكلفة الإجمالية لفريق كامل مع اشتراكات المشغل.",
        },
        href: "/planifier/masse-salariale",
        badge: "new",
        icon: "👥",
      },
      {
        title: { fr: "Cout de Recrutement", ar: "تكلفة التوظيف" },
        description: {
          fr: "Cout total d'un recrutement: charges, cabinet, onboarding, equipement.",
          ar: "التكلفة الإجمالية للتوظيف: اشتراكات، وكالة، تأهيل، معدات.",
        },
        href: "/planifier/cout-recrutement",
        badge: "new",
        icon: "🎯",
      },
      {
        title: { fr: "Optimisation Remuneration", ar: "تحسين الأجر" },
        description: {
          fr: "Comparez salaire pur vs salaire + prime vs salaire + avantages. Maximisez le net.",
          ar: "قارن الأجر الصرف مقابل الأجر + المنحة مقابل الأجر + المزايا.",
        },
        href: "/planifier/optimisation-remuneration",
        badge: "new",
        icon: "⚙️",
      },
    ],
  },
  {
    titleKey: "planifierPage.groupFreelanceTitle",
    subtitleKey: "planifierPage.groupFreelanceSubtitle",
    items: [
      {
        title: { fr: "Auto-Entrepreneur", ar: "المقاول الذاتي" },
        description: {
          fr: "Net apres impot AE (1%/2%), CNSS optionnel et projection annuelle.",
          ar: "الصافي بعد ضريبة المقاول الذاتي (1%/2%) والـ CNSS الاختيارية.",
        },
        href: "/planifier/auto-entrepreneur",
        badge: "new",
        icon: "💼",
      },
      {
        title: { fr: "Tarification Freelance (TJM)", ar: "تسعير المستقل" },
        description: {
          fr: "Calculez votre TJM pour atteindre votre objectif de revenu net.",
          ar: "احسب أجرك اليومي لبلوغ هدفك من الدخل الصافي.",
        },
        href: "/planifier/tarification-freelance",
        badge: "new",
        icon: "💰",
      },
      {
        title: { fr: "Benefice Net (Charges vs Profit)", ar: "الربح الصافي" },
        description: {
          fr: "Revenus moins charges: marge nette reelle et analyse par categorie.",
          ar: "الإيرادات ناقص الأعباء: هامش الربح الصافي والتحليل التفصيلي.",
        },
        href: "/planifier/benefice-net",
        badge: "new",
        icon: "📊",
      },
    ],
  },
];

export default function PlanifierPage() {
  const { t, language } = useLanguage();

  const totalTools = planGroups.reduce((s, g) => s + g.items.length, 0);

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">

        {/* Hero section */}
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("planifierPage.kicker")}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            {t("planifierPage.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {t("planifierPage.description")}
          </p>
          <p className="mt-4 text-xs text-[var(--ink-soft)]">
            {t("planifierPage.toolsCount", { count: totalTools })} disponibles
          </p>
        </section>

        {/* Ad */}
        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="7777777777" format="auto" />
          </div>
        </section>

        {/* Tool groups */}
        <div className="mt-5 space-y-5">
          {planGroups.map((group, groupIndex) => (
            <section
              key={group.titleKey}
              className={`rounded-3xl p-5 ${groupIndex % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
            >
              <div className="mb-4">
                <p className="section-kicker">{t(group.titleKey)}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {t(group.subtitleKey)} ({t("planifierPage.toolsCount", { count: group.items.length })})
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item, index) => (
                  <article
                    key={item.href}
                    className={`rounded-2xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.badge === "pro"
                              ? "bg-[var(--accent)] text-white"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {item.badge === "pro" ? t("planifierPage.badgePaid") : t("planifierPage.badgeNew")}
                        </span>
                      )}
                    </div>
                    <h2 className="display-font mt-3 text-xl font-semibold leading-tight">
                      {item.title[language]}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                      {item.description[language]}
                    </p>
                    <Link href={item.href} className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
                      {t("common.open")}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom ad */}
        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="8888888888" format="auto" />
          </div>
        </section>
      </div>
    </main>
  );
}
