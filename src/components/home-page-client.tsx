"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { PartnerAdSection } from "@/components/partner-ad-section";
import { features, type Article, type Category } from "@/lib/content/home-content";
import { Container } from "@/components/container";

// Image placeholder component
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[var(--surface-muted)] to-[var(--surface)] border border-[var(--line)] ${className}`}>
      <svg className="w-8 h-8 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

// Safe image component with fallback
function SafeImage({ src, alt, className, ...props }: any) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <ImagePlaceholder className={className} />;
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

const categoryArabicLabels: Record<string, { name: string; description: string }> = {
  salaire: { name: "الأجر", description: "الصافي والإجمالي وIR وCNSS وAMO والتحقق من كشف الأجر." },
  licenciement: { name: "الفصل", description: "التعويضات والإشعار والفصل التعسفي والخطوات العملية." },
  conges: { name: "العطل", description: "الاستحقاق والترصيد والعطل المرضية وعطلة الأمومة." },
  cnss: { name: "CNSS", description: "التسجيل والاشتراكات والتعويضات والشكايات." },
  contrats: { name: "العقود", description: "CDI وCDD وفترة التجربة والتعديلات والالتزامات." },
  "heures-sup": { name: "الساعات الإضافية", description: "الزيادات وساعات الليل وعطلة الأسبوع والأعياد." },
  maternite: { name: "الأمومة", description: "المدة القانونية وتعويض CNSS والتزامات المشغل." },
  litiges: { name: "النزاعات", description: "الشكايات والتفتيش والإثباتات ومتابعة الملف." },
};

const featureArabicLabels: Record<string, { title: string; description: string }> = {
  "/salaire": {
    title: "حسابات قابلة للتحقق",
    description: "كل نتيجة تعرض النسخة القانونية والاقتطاعات والصيغة المعتمدة.",
  },
  "/modeles": {
    title: "وثائق مطابقة",
    description: "رسائل جاهزة مع مراجع قانونية وتنسيق مناسب للطباعة.",
  },
  "/simulateurs": {
    title: "حسابات قابلة للتحقق",
    description: "كل نتيجة تعرض النسخة القانونية والاقتطاعات والصيغة المعتمدة.",
  },
  "/documents": {
    title: "وثائق مطابقة",
    description: "رسائل جاهزة مع مراجع قانونية وتنسيق مناسب للطباعة.",
  },
  "/compte": {
    title: "متابعة شخصية",
    description: "تابع الأقدمية والعطل التقديرية وسجل المحاكاة داخل حسابك.",
  },
};

function categoryName(slug: string, language: "fr" | "ar", categories: Category[]): string {
  const fallback = categories.find((category) => category.slug === slug)?.name ?? slug;
  if (language === "ar") {
    return categoryArabicLabels[slug]?.name ?? fallback;
  }
  return fallback;
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
  const sideArticles = initialArticles.slice(1, 5);
  const categoryCounts = initialArticles.reduce<Record<string, number>>((acc, article) => {
    acc[article.categorySlug] = (acc[article.categorySlug] ?? 0) + 1;
    return acc;
  }, {});
  const heroCtas =
    language === "ar"
      ? {
          simulate: "محاكاة حقوقي",
          planifier: "تخطيط مساري",
          tools: "أدوات الحماية",
          documents: "إنشاء وثيقة",
        }
      : {
          simulate: t("home.ctaSimulate"),
          planifier: t("home.ctaPlan"),
          tools: t("home.ctaTools"),
          documents: t("home.ctaDocuments"),
        };

  return (
    <main className="min-h-screen text-[var(--foreground)] w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 lg:py-40 bg-[var(--surface-muted)] border-b border-[var(--line)]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
        <Container className="relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center rounded-full border border-[var(--accent-soft)] bg-[var(--surface)] px-3 py-1 text-sm font-medium text-[var(--accent-strong)] mb-8 shadow-sm">
            {t("home.kicker")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--heading)] sm:text-5xl lg:text-7xl max-w-4xl text-balance">
            {t("home.title")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-[var(--ink-soft)] max-w-2xl text-balance">
            {t("home.description")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-4">
            <Link href="/simulateurs" className="btn-primary text-base px-8 py-3.5 shadow-md">
              {heroCtas.simulate}
            </Link>
            <Link href="/planifier" className="btn-muted text-base px-8 py-3.5">
              {heroCtas.planifier}
            </Link>
            <Link href="/outils" className="btn-muted text-base px-8 py-3.5">
              {heroCtas.tools}
            </Link>
            <Link href="/documents" className="btn-muted text-base px-8 py-3.5">
              {heroCtas.documents}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl w-full">
            {[
              { id: "sim", label: t("home.statsSimulations"), count: "20+" },
              { id: "plan", label: t("home.statsPlanifier"), count: "17" },
              { id: "prot", label: t("home.statsTools"), count: "7" },
              { id: "doc", label: t("home.statsDocuments"), count: "50+" },
            ].map((stat) => (
              <div key={stat.id} className="panel-strong flex flex-col items-center justify-center p-6 text-center">
                <span className="text-3xl font-black text-[var(--accent)] mb-1">{stat.count}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">{stat.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tools Showcase Section */}
      <section className="py-24 sm:py-32 bg-[var(--surface)] border-y border-[var(--line)]">
        <Container>
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-[var(--accent)] uppercase tracking-wide">
              {language === "ar" ? "المسارات والادوات" : "Parcours et outils"}
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">
              {language === "ar" ? "حلول عملية لحقوقك في الشغل" : "Des actions claires pour vos droits au travail"}
            </p>
            <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
              {language === "ar" ? "احسب حقوقك، حضر نموذجك، وانتقل مباشرة الى الخطوة التالية." : "Calculez, verifiez et preparez la bonne demarche sans chercher dans plusieurs rubriques."}
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: language === "ar" ? "صافي واجمالي" : "Salaire net et retenues",
                  description: language === "ar" ? "احسب الاجر الصافي والاقتطاعات وافهم كشف الاجر." : "Calculez votre net, vos retenues et les principaux montants de paie.",
                  href: "/salaire",
                  category: language === "ar" ? "أجر" : "Salaire"
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: language === "ar" ? "مغادرة الشغل" : "Depart, preavis et droits",
                  description: language === "ar" ? "تحقق من الاستقالة او الفصل واحسب التعويضات والخطوات." : "Verifiez le preavis, les indemnites et les documents utiles en cas de depart.",
                  href: "/contrat-depart",
                  category: language === "ar" ? "مغادرة" : "Depart"
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                  title: language === "ar" ? "نماذج ورسائل" : "Modeles utiles",
                  description: language === "ar" ? "رسائل جاهزة ومبسطة حسب وضعيتك." : "Accedez aux lettres et modeles les plus utiles pour vos demarches.",
                  href: "/modeles",
                  category: language === "ar" ? "نماذج" : "Modeles"
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: language === "ar" ? "الساعات الاضافية" : "Heures supplementaires",
                  description: language === "ar" ? "احسب الزيادات القانونية والعطل والغيابات." : "Calculez les majorations, jours feries et autres droits lies au temps de travail.",
                  href: "/simulateurs/heures-supplementaires",
                  category: language === "ar" ? "وقت" : "Temps"
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: language === "ar" ? "العطل و CNSS" : "Conges et CNSS",
                  description: language === "ar" ? "تحقق من العطل، المرض، الامومة وحقوق CNSS." : "Retrouvez vos droits sur les conges, l'arret maladie, la maternite et la CNSS.",
                  href: "/conges-cnss",
                  category: language === "ar" ? "عطل" : "Conges"
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  title: language === "ar" ? "قرارات مهنية" : "Carriere et choix pro",
                  description: language === "ar" ? "قارن بين السيناريوهات المهنية والعمل الحر والاجر." : "Comparez vos scenarios de carriere, freelance ou evolution salariale.",
                  href: "/carriere",
                  category: language === "ar" ? "مسار" : "Carriere"
                }
              ].map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="soft-card flex flex-col p-8 transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-[var(--surface)] group"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mb-6 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                    {tool.icon}
                  </div>
                  <div className="flex items-center gap-x-3 mb-4">
                    <span className="text-xs font-semibold text-[var(--accent-strong)] uppercase tracking-wide">
                      {tool.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold leading-tight text-[var(--heading)] mb-4 group-hover:text-[var(--accent)] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-base leading-relaxed text-[var(--ink-soft)] flex-grow">
                    {tool.description}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-[var(--accent)]">
                    {language === "ar" ? "ابدأ" : "Commencer"}
                    <span aria-hidden="true" className="mr-2 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Features Outline */}
      <section className="py-24 sm:py-32 bg-[var(--background)]">
        <Container>
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-[var(--accent)] uppercase tracking-wide">
              {t("home.featureLabel")}
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">
              Tout ce dont vous avez besoin
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="soft-card flex flex-col p-8 transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-[var(--surface)]"
                >
                  <h3 className="text-xl font-semibold leading-tight text-[var(--heading)]">
                    {language === "ar" ? featureArabicLabels[feature.href]?.title ?? feature.title : feature.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)] flex-grow">
                    {language === "ar" ? featureArabicLabels[feature.href]?.description ?? feature.description : feature.description}
                  </p>
                  <div className="mt-8 flex items-center text-sm font-semibold text-[var(--accent)] group">
                    {t("common.explore")}
                    <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Categories Grid */}
      <section className="py-24 sm:py-32 bg-[var(--surface-muted)] border-y border-[var(--line)]">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)]">{t("home.categoriesTitle")}</h2>
            <Link href="/articles" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors">
              {t("common.all")} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/articles?category=${category.slug}`}
                className="panel-strong rounded-2xl p-6 transition hover:shadow-sm"
              >
                <h3 className="font-semibold text-[var(--heading)] text-lg">
                  {language === "ar" ? categoryArabicLabels[category.slug]?.name ?? category.name : category.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)] line-clamp-2">
                  {language === "ar" ? categoryArabicLabels[category.slug]?.description ?? category.description : category.description}
                </p>
                <div className="mt-4 inline-flex items-center rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {t("libraryPage.contentCount", { count: categoryCounts[category.slug] ?? 0 })}
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Spotlight and Latest Articles */}
      {spotlight && (
        <section className="py-24 sm:py-32 bg-[var(--background)]">
          <Container>
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">
                Actualités et guides récents
              </h2>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-[1.2fr_1fr]">
              <article className="soft-card flex flex-col p-8 bg-[var(--surface)]">
                {spotlight.coverImageUrl || spotlight.thumbnailUrl ? (
                  <div className="relative mb-8">
                    <SafeImage
                      src={spotlight.coverImageUrl || spotlight.thumbnailUrl || ""}
                      alt={spotlight.title}
                      width={1200}
                      height={600}
                      className="aspect-[2/1] w-full rounded-2xl object-cover object-center border border-[var(--line)]"
                      unoptimized
                    />
                  </div>
                ) : (
                  <ImagePlaceholder className="mb-8 aspect-[2/1] w-full rounded-2xl" />
                )}
                <div className="flex items-center gap-x-4 text-xs">
                  <span className="text-[var(--ink-soft)]">{spotlight.readingTime}</span>
                  <span className="relative z-10 rounded-full bg-[var(--surface-strong)] px-3 py-1.5 font-medium text-[var(--heading)]">
                    {categoryName(spotlight.categorySlug, language, categories)}
                  </span>
                </div>
                <div className="group relative mt-6 max-w-2xl">
                  <h3 className="text-3xl font-bold leading-tight text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors">
                    <Link href={spotlight.href}>
                      <span className="absolute inset-0" />
                      {spotlight.title}
                    </Link>
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">{spotlight.excerpt}</p>
                </div>
                <div className="mt-8 flex items-center">
                  <span className="text-sm font-semibold text-[var(--accent)]">
                    {t("common.readFull")} <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </article>

              <div className="flex flex-col gap-8">
                {sideArticles.map((article) => (
                  <article key={article.title} className="soft-card p-6 flex gap-6 items-start">
                    <div className="w-32 h-24 flex-shrink-0">
                      {(article.thumbnailUrl || article.coverImageUrl) ? (
                        <div className="relative w-full h-full">
                          <SafeImage
                            src={article.thumbnailUrl || article.coverImageUrl || ""}
                            alt={article.title}
                            width={300}
                            height={200}
                            className="aspect-[4/3] w-full h-full rounded-xl object-cover border border-[var(--line)]"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <ImagePlaceholder className="aspect-[4/3] w-full h-full rounded-xl" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-x-4 text-xs mb-3">
                        <span className="text-[var(--ink-soft)]">{article.readingTime}</span>
                        <span className="text-[var(--accent)] font-medium">
                          {categoryName(article.categorySlug, language, categories)}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold leading-snug text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors">
                        <Link href={article.href}>
                          {article.title}
                        </Link>
                      </h4>
                      <p className="mt-2 text-sm text-[var(--ink-soft)] line-clamp-2">{article.excerpt}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Footer Ad Space */}
      <section className="py-12 bg-[var(--surface-muted)] border-t border-[var(--line)]">
        <PartnerAdSection slot="2222222222" className="py-12 bg-[var(--surface-muted)] border-t border-[var(--line)]" />
      </section>
    </main>
  );
}
