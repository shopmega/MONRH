"use client";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { PartnerAdSection } from "@/components/partner-ad-section";
import { type Article, type Category } from "@/lib/content/home-content";

type SafeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string;
  alt: string;
  className?: string;
};

const ARABIC_CATEGORY_LABELS: Record<string, string> = {
  salaire: "الأجر",
  licenciement: "الفصل",
  conges: "العطل",
  cnss: "CNSS",
  contrats: "العقود",
  "heures-sup": "الساعات الإضافية",
  maternite: "الأمومة",
  litiges: "النزاعات",
};

const HERO_TOOLS = [
  {
    id: "salaire",
    label: "Salaire net et brut",
    sublabel: "Calculateur 2026",
    href: "/salaire",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "conges",
    label: "Solde de fin de contrat",
    sublabel: "Départ",
    href: "/conges-cnss",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    id: "carriere",
    label: "Évolution de carrière",
    sublabel: "Simulation",
    href: "/carriere",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#eef0ed] ${className ?? ""}`}>
      <svg className="h-9 w-9 text-[#5f675f]/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <ImagePlaceholder className={className} />;
  }

  return <Image {...props} src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
}

function categoryName(slug: string, language: "fr" | "ar", categories: Category[]): string {
  const fallback = categories.find((category) => category.slug === slug)?.name ?? slug;
  return language === "ar" ? ARABIC_CATEGORY_LABELS[slug] ?? fallback : fallback;
}

function SectionHeader({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5022]">{title}</p>
      {href && action ? (
        <Link href={href} className="shrink-0 text-sm font-bold text-[#14534a] hover:text-[#0f3d36]">
          {action} →
        </Link>
      ) : null}
    </div>
  );
}

export function HomePageClient({
  initialArticles,
  categories,
}: {
  initialArticles: Article[];
  categories: Category[];
}) {
  const { t, language } = useLanguage();
  const spotlight = initialArticles[0];
  const latestArticles = initialArticles.slice(1, 7);
  const categoryCounts = initialArticles.reduce<Record<string, number>>((acc, article) => {
    acc[article.categorySlug] = (acc[article.categorySlug] ?? 0) + 1;
    return acc;
  }, {});

  const heroTitle =
    language === "ar"
      ? "سلطتك في قانون الشغل والموارد البشرية."
      : "Votre autorité en droit social et gestion RH.";

  return (
    <main className="min-h-screen bg-[#f7f7f4] pt-20 text-[#171717]">
      <section className="border-b border-[#e2e3dc] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16 xl:gap-16">
          <div className="flex min-w-0 flex-col justify-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#8a5022]">{t("home.kicker")}</p>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-normal text-[#151515] sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#535a55] lg:text-lg">{t("home.description")}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/simulate" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#8a5022] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#713f19]">
                {language === "ar" ? "محاكاة حقوقي" : t("home.ctaSimulate")}
              </Link>
              <Link href="/planifier" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#ccd8d1] bg-[#eef6f1] px-6 text-sm font-bold text-[#14534a] transition hover:bg-[#e0eee7]">
                {language === "ar" ? "تخطيط مساري" : t("home.ctaPlan")}
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { count: "20+", label: t("home.statsSimulations") },
                { count: "17", label: t("home.statsPlanifier") },
                { count: "7", label: t("home.statsTools") },
                { count: "50+", label: t("home.statsDocuments") },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#e2e3dc] bg-[#fbfbf8] p-4">
                  <span className="block text-2xl font-black text-[#8a5022]">{stat.count}</span>
                  <span className="mt-1 block text-xs font-semibold leading-snug text-[#5f675f]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-[#d8dfd8] bg-[#f4faf6] p-5 shadow-sm lg:p-6">
            <SectionHeader title={language === "ar" ? "الأدوات الأساسية" : "Accès rapide"} />
            <div className="grid gap-3">
              {HERO_TOOLS.map((tool) => (
                <Link key={tool.id} href={tool.href} className="group rounded-lg border border-[#dfe4dc] bg-white p-4 transition hover:border-[#b6cabf] hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eef6f1] text-[#14534a]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tool.icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5022]">{tool.sublabel}</p>
                      <p className="mt-1 text-base font-extrabold text-[#151515]">{tool.label}</p>
                    </div>
                    <span className="font-bold text-[#14534a] transition group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/outils" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#14534a] px-4 text-sm font-bold text-white hover:bg-[#0f3d36]">
              {language === "ar" ? "استعراض كل الأدوات" : "Voir tous les outils"} →
            </Link>
          </aside>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-12">
        <div className="min-w-0 space-y-8">
          {spotlight ? (
            <section>
              <SectionHeader title={language === "ar" ? "الأداة المميزة" : "Outil vedette"} />
              <Link href="/salaire" className="group grid overflow-hidden rounded-lg border border-[#d8dfd8] bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="p-6 sm:p-8">
                  <span className="inline-flex rounded-lg bg-[#f5eadf] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5022]">
                    ★ Recommandé
                  </span>
                  <h2 className="mt-5 max-w-xl text-3xl font-black leading-tight text-[#151515] sm:text-4xl">
                    Simulateur de salaire net et brut
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[#535a55]">
                    Calcul temps réel CNSS, AMO et IR. Passez du brut au net en quelques secondes.
                  </p>
                  <span className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#8a5022] px-5 text-sm font-bold text-white transition group-hover:bg-[#713f19]">
                    Calculer →
                  </span>
                </div>
                <div className="relative min-h-56 bg-[#14534a] lg:min-h-full">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0))]" />
                  <div className="relative flex h-full flex-col justify-end p-6 text-white">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Maroc 2026</p>
                    <p className="mt-3 text-5xl font-black">Net ↔ Brut</p>
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          {categories.length > 0 ? (
            <section>
              <SectionHeader title={t("home.categoriesTitle")} href="/articles" action={t("common.all")} />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {categories.slice(0, 8).map((category) => (
                  <Link key={category.slug} href={`/articles?category=${category.slug}`} className="rounded-lg border border-[#e2e3dc] bg-white p-4 transition hover:border-[#b6cabf] hover:shadow-sm">
                    <p className="text-base font-extrabold leading-snug text-[#151515]">
                      {categoryName(category.slug, language, categories)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#8a5022]">{categoryCounts[category.slug] ?? 0} articles</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {spotlight ? (
            <section>
              <SectionHeader title={language === "ar" ? "أحدث المقالات" : "Actualités et guides"} href="/articles" action={t("common.all")} />
              <Link href={spotlight.href} className="group grid overflow-hidden rounded-lg border border-[#d8dfd8] bg-white shadow-sm md:grid-cols-[280px_minmax(0,1fr)]">
                <div className="relative aspect-[16/10] bg-[#eef0ed] md:aspect-auto">
                  <SafeImage src={spotlight.coverImageUrl || spotlight.thumbnailUrl} alt={spotlight.title} fill className="object-cover" unoptimized />
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded-lg bg-white/92 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#8a5022] backdrop-blur">
                      {categoryName(spotlight.categorySlug, language, categories)}
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f675f]">{spotlight.readingTime} de lecture</p>
                  <h3 className="mt-3 text-2xl font-black leading-tight text-[#151515] group-hover:text-[#14534a]">
                    {spotlight.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-base leading-7 text-[#535a55]">{spotlight.excerpt}</p>
                  <span className="mt-5 inline-flex text-sm font-bold text-[#14534a]">{t("common.readFull")} →</span>
                </div>
              </Link>
            </section>
          ) : null}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          {latestArticles.length > 0 ? (
            <section>
              <SectionHeader title={language === "ar" ? "À lire ensuite" : "À lire ensuite"} />
              <div className="grid gap-3">
                {latestArticles.map((article) => (
                  <Link key={article.title} href={article.href} className="group rounded-lg border border-[#e2e3dc] bg-white p-3 transition hover:border-[#b6cabf] hover:shadow-sm">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#eef0ed]">
                        <SafeImage src={article.thumbnailUrl || article.coverImageUrl} alt={article.title} fill className="object-cover" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8a5022]">
                          {categoryName(article.categorySlug, language, categories)}
                        </p>
                        <h4 className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-[#151515] group-hover:text-[#14534a]">
                          {article.title}
                        </h4>
                        <p className="mt-1 text-xs text-[#5f675f]">{article.readingTime}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-[#e2e3dc] bg-white p-4">
            <PartnerAdSection slot="2222222222" className="w-full" />
          </section>
        </aside>
      </div>
    </main>
  );
}
