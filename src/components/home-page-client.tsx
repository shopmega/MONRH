"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { PartnerAdSection } from "@/components/partner-ad-section";
import { type Article, type Category } from "@/lib/content/home-content";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#efeded] ${className}`}>
      <svg className="w-8 h-8 text-[#52443b]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function SafeImage({ src, alt, className, ...props }: any) {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) return <ImagePlaceholder className={className} />;
  return <Image {...props} src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
}

function categoryName(slug: string, language: "fr" | "ar", categories: Category[]): string {
  const arabicLabels: Record<string, string> = {
    salaire: "الأجر", licenciement: "الفصل", conges: "العطل",
    cnss: "CNSS", contrats: "العقود", "heures-sup": "الساعات الإضافية",
    maternite: "الأمومة", litiges: "النزاعات",
  };
  const fallback = categories.find((c) => c.slug === slug)?.name ?? slug;
  return language === "ar" ? arabicLabels[slug] ?? fallback : fallback;
}

// Quick-access tools shown in the hero section
const HERO_TOOLS = [
  { id: "salaire", label: "Salaire Net et Brut", sublabel: "2024", href: "/salaire", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "conges", label: "Solde de fin de Contrat", sublabel: "Calculateur", href: "/conges-cnss", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "carriere", label: "Évolution de Carrière", sublabel: "Simulateur", href: "/carriere", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

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
  const categoryCounts = initialArticles.reduce<Record<string, number>>((acc, a) => {
    acc[a.categorySlug] = (acc[a.categorySlug] ?? 0) + 1;
    return acc;
  }, {});

  const heroTitle = language === "ar"
    ? "سلطتك في قانون\nالشغل والموارد\nالبشرية."
    : "Votre autorité en\ndroit social et\ngestion RH.";

  return (
    <main className="min-h-screen bg-[#F8F5F2] font-sans">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white px-5 pt-20 pb-8">
        {/* Kicker */}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a5022] mb-4">
          {t("home.kicker")}
        </p>

        {/* Headline */}
        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-[#1a1a1a] leading-[1.15] whitespace-pre-line mb-4">
          {heroTitle}
        </h1>

        {/* Description */}
        <p className="text-sm text-[#6b5e55] leading-relaxed max-w-sm mb-6">
          {t("home.description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/simulate" className="bg-[#8a5022] text-white font-bold text-sm px-6 py-3 rounded-full">
            {language === "ar" ? "محاكاة حقوقي" : t("home.ctaSimulate")}
          </Link>
          <Link href="/planifier" className="bg-[#F0EAE4] text-[#8a5022] font-bold text-sm px-6 py-3 rounded-full">
            {language === "ar" ? "تخطيط مساري" : t("home.ctaPlan")}
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-px bg-[#F0EAE4] rounded-2xl overflow-hidden">
          {[
            { count: "20+", label: t("home.statsSimulations") },
            { count: "17", label: t("home.statsPlanifier") },
            { count: "7", label: t("home.statsTools") },
            { count: "50+", label: t("home.statsDocuments") },
          ].map((s) => (
            <div key={s.label} className="bg-white flex flex-col items-center py-3 px-1 text-center">
              <span className="text-xl font-extrabold text-[#8a5022]">{s.count}</span>
              <span className="text-[9px] font-semibold text-[#6b5e55] mt-0.5 leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED TOOL  ────────────────────────────────────────── */}
      {spotlight && (
        <section className="px-5 mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a5022] mb-3">
            {language === "ar" ? "الأداة المميزة" : "Outil Vedette"}
          </p>

          <Link href="/salaire" className="block rounded-3xl overflow-hidden">
            <div className="relative bg-[#8a5022] min-h-[200px]">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)"}} />
              <div className="relative p-6">
                <span className="inline-block bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  ★ Recommandé
                </span>
                <h2 className="text-[22px] font-extrabold text-white leading-tight mb-2">
                  Simulateur de<br />Salaire Net et Brut<br />
                  <span className="text-base font-semibold text-white/70">2024</span>
                </h2>
                <p className="text-sm text-white/75 leading-relaxed mt-1 mb-5 max-w-[260px]">
                  Calcul temps réel CNSS, AMO et IR. Passez du brut au net en quelques secondes.
                </p>
                <span className="bg-white text-[#8a5022] font-bold text-sm px-5 py-2.5 rounded-full inline-flex items-center gap-1.5">
                  Calculer <span>→</span>
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── TOOL LIST ROWS ────────────────────────────────────────── */}
      <section className="px-5 mt-6 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a5022] mb-3">
          {language === "ar" ? "المسارات والأدوات" : "Parcours et Outils"}
        </p>

        {HERO_TOOLS.map((tool) => (
          <Link key={tool.id} href={tool.href} className="block">
            <div className="bg-white rounded-3xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F0EAE4] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#8a5022]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tool.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a5022] mb-0.5">{tool.sublabel}</p>
                <p className="text-[14px] font-bold text-[#1a1a1a] leading-snug">{tool.label}</p>
              </div>
              <span className="text-[#8a5022] font-bold text-base flex-shrink-0">→</span>
            </div>
          </Link>
        ))}

        <Link href="/outils" className="block">
          <div className="bg-[#F0EAE4] rounded-3xl p-4 text-center">
            <p className="text-sm font-bold text-[#8a5022]">
              {language === "ar" ? "استعراض كل الأدوات" : "Voir tous les outils"} →
            </p>
          </div>
        </Link>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="px-5 mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a5022]">
              {t("home.categoriesTitle")}
            </p>
            <Link href="/articles" className="text-[11px] font-bold text-[#8a5022]">
              {t("common.all")} →
            </Link>
          </div>

          {/* Horizontal scroll chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.slug}
                href={`/articles?category=${cat.slug}`}
                className="flex-shrink-0 bg-white rounded-2xl px-4 py-2.5 flex flex-col min-w-[130px]"
              >
                <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight">
                  {language === "ar"
                    ? ({ salaire: "الأجر", licenciement: "الفصل", conges: "العطل", cnss: "CNSS", contrats: "العقود", litiges: "النزاعات" } as any)[cat.slug] ?? cat.name
                    : cat.name}
                </p>
                <p className="text-[10px] text-[#8a5022] font-semibold mt-1">
                  {categoryCounts[cat.slug] ?? 0} articles
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── SPOTLIGHT ARTICLE ─────────────────────────────────────── */}
      {spotlight && (
        <section className="px-5 mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a5022]">
              {language === "ar" ? "أحدث المقالات" : "Actualités et Guides"}
            </p>
            <Link href="/articles" className="text-[11px] font-bold text-[#8a5022]">
              {t("common.all")} →
            </Link>
          </div>

          <Link href={spotlight.href} className="block">
            <div className="bg-white rounded-3xl overflow-hidden">
              {/* Image */}
              <div className="relative w-full aspect-[16/9] bg-[#efeded]">
                {spotlight.coverImageUrl || spotlight.thumbnailUrl ? (
                  <SafeImage
                    src={spotlight.coverImageUrl || spotlight.thumbnailUrl}
                    alt={spotlight.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <ImagePlaceholder className="w-full h-full" />
                )}
                {/* Category badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-[#8a5022] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                    {categoryName(spotlight.categorySlug, language, categories)}
                  </span>
                </div>
              </div>
              {/* Text */}
              <div className="p-5">
                <p className="text-[10px] font-semibold text-[#6b5e55] mb-2">{spotlight.readingTime} de lecture</p>
                <h3 className="text-[16px] font-extrabold text-[#1a1a1a] leading-snug mb-2">
                  {spotlight.title}
                </h3>
                <p className="text-sm text-[#6b5e55] leading-relaxed line-clamp-2 mb-4">
                  {spotlight.excerpt}
                </p>
                <span className="text-sm font-bold text-[#8a5022]">{t("common.readFull")} →</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── ARTICLE LIST ─────────────────────────────────────────── */}
      {latestArticles.length > 0 && (
        <section className="px-5 mt-4 space-y-3">
          {latestArticles.map((article) => (
            <Link key={article.title} href={article.href} className="block">
              <div className="bg-white rounded-2xl p-4 flex gap-4 items-start">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative bg-[#efeded]">
                  {article.thumbnailUrl || article.coverImageUrl ? (
                    <SafeImage
                      src={article.thumbnailUrl || article.coverImageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImagePlaceholder className="w-full h-full" />
                  )}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8a5022]">
                      {categoryName(article.categorySlug, language, categories)}
                    </span>
                    <span className="text-[9px] text-[#6b5e55]">• {article.readingTime}</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-[#1a1a1a] leading-snug line-clamp-2">
                    {article.title}
                  </h4>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* ── PARTNER AD ───────────────────────────────────────────── */}
      <section className="px-5 mt-6 mb-10">
        <div className="bg-white rounded-3xl p-4 overflow-hidden">
          <PartnerAdSection slot="2222222222" className="w-full" />
        </div>
      </section>

    </main>
  );
}

