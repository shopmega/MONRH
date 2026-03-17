"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { AdSlot } from "@/components/ad-slot";
import { features, type Article, type Category } from "@/lib/content/home-content";
import { Container } from "@/components/container";

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
              {t("home.ctaSimulate")}
            </Link>
            <Link href="/documents" className="btn-muted text-base px-8 py-3.5">
              {t("home.ctaDocument")}
            </Link>
            <Link href="/bibliotheque" className="btn-muted text-base px-8 py-3.5">
              {t("home.ctaLibrary")}
            </Link>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-[var(--line)] bg-[var(--surface)]">
        <Container>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3 text-center">
            {[
              { k: t("common.simulationsLabel"), v: t("home.statsSimulations", { count: 14 }) },
              { k: t("nav.library"), v: t("home.statsLibrary", { count: initialArticles.length }) },
              { k: t("nav.documents"), v: t("home.statsGenerators", { count: features.length > 0 ? 14 : 0 }) },
            ].map((item) => (
              <div key={item.k} className="mx-auto flex max-w-xs flex-col gap-y-2">
                <dt className="text-sm uppercase tracking-wider text-[var(--ink-soft)] font-medium">{item.k}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-[var(--heading)] sm:text-4xl">{item.v}</dd>
              </div>
            ))}
          </dl>
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
            <Link href="/bibliotheque" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors">
              {t("common.all")} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/bibliotheque?category=${category.slug}`}
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
            <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
              <article className="soft-card flex flex-col p-8 bg-[var(--surface)]">
                {spotlight.coverImageUrl || spotlight.thumbnailUrl ? (
                  <Image
                    src={spotlight.coverImageUrl || spotlight.thumbnailUrl || ""}
                    alt={spotlight.title}
                    width={1200}
                    height={600}
                    className="mb-8 aspect-[2/1] w-full rounded-2xl object-cover object-center border border-[var(--line)]"
                    unoptimized
                  />
                ) : null}
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
                  <article key={article.title} className="soft-card p-6 flex flex-col sm:flex-row gap-6 items-start">
                    {(article.thumbnailUrl || article.coverImageUrl) && (
                      <div className="w-full sm:w-1/3 flex-shrink-0">
                         <Image
                          src={article.thumbnailUrl || article.coverImageUrl || ""}
                          alt={article.title}
                          width={300}
                          height={200}
                          className="aspect-[3/2] w-full rounded-xl object-cover border border-[var(--line)]"
                          unoptimized
                        />
                      </div>
                    )}
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
        <Container>
           <p className="text-center text-xs uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-4">{t("common.partner")}</p>
           <div className="soft-card p-4 mx-auto max-w-4xl bg-white flex items-center justify-center min-h-[100px]">
             <AdSlot slot="2222222222" format="auto" />
           </div>
        </Container>
      </section>
    </main>
  );
}

