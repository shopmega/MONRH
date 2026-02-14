"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { AdSlot } from "@/components/ad-slot";
import { features, type Article, type Category } from "@/lib/content/home-content";

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
  "/simulate": {
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
    <main className="paper-bg min-h-screen text-[var(--foreground)]">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="enter-up soft-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute -left-14 top-20 h-40 w-40 rounded-full bg-[var(--paper-glow-a)]/70 blur-2xl" />
          <div className="absolute -right-20 -top-12 h-52 w-52 rounded-full bg-[var(--paper-glow-b)]/80 blur-2xl" />

          <p className="section-kicker">{t("home.kicker")}</p>
          <h1 className="display-font mt-3 max-w-3xl text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
            {t("home.description")}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/simulate" className="btn-primary px-5 py-2.5 text-sm">
              {t("home.ctaSimulate")}
            </Link>
            <Link href="/documents" className="btn-muted px-5 py-2.5 text-sm">
              {t("home.ctaDocument")}
            </Link>
            <Link href="/bibliotheque" className="btn-muted px-5 py-2.5 text-sm">
              {t("home.ctaLibrary")}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { k: t("common.simulationsLabel"), v: t("home.statsSimulations", { count: 14 }) },
              { k: t("nav.library"), v: t("home.statsLibrary", { count: initialArticles.length }) },
              { k: t("nav.documents"), v: t("home.statsGenerators", { count: features.length > 0 ? 14 : 0 }) },
            ].map((item) => (
              <div key={item.k} className="panel-strong rounded-2xl p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">{item.k}</p>
                <p className="mt-1 font-semibold">{item.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="enter-up enter-delay-1 mt-5 grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="soft-card group rounded-3xl p-5 transition duration-200 hover:-translate-y-0.5"
            >
              <p className="section-kicker">{t("home.featureLabel")}</p>
              <p className="display-font mt-2 text-2xl font-semibold leading-tight">
                {language === "ar" ? featureArabicLabels[feature.href]?.title ?? feature.title : feature.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                {language === "ar" ? featureArabicLabels[feature.href]?.description ?? feature.description : feature.description}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                {t("common.explore")}
              </p>
            </Link>
          ))}
        </section>

        <section className="enter-up enter-delay-2 mt-5 soft-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="display-font text-2xl font-semibold">{t("home.categoriesTitle")}</h2>
            <Link href="/bibliotheque" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              {t("common.all")}
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/bibliotheque?category=${category.slug}`}
                className="panel-strong rounded-2xl p-3 transition hover:translate-y-[-1px]"
              >
                <p className="font-semibold">
                  {language === "ar" ? categoryArabicLabels[category.slug]?.name ?? category.name : category.name}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {language === "ar" ? categoryArabicLabels[category.slug]?.description ?? category.description : category.description}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {t("libraryPage.contentCount", { count: categoryCounts[category.slug] ?? 0 })}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="enter-up enter-delay-2 mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="1111111111" format="auto" />
          </div>
        </section>

        {spotlight ? <section className="enter-up enter-delay-3 mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="soft-card rounded-3xl p-6">
            {spotlight.coverImageUrl || spotlight.thumbnailUrl ? (
              <Image
                src={spotlight.coverImageUrl || spotlight.thumbnailUrl || ""}
                alt={spotlight.title}
                width={1200}
                height={480}
                className="mb-4 h-48 w-full rounded-2xl object-cover"
                unoptimized
              />
            ) : null}
            <p className="section-kicker">
              {t("home.spotlightLabel")} | {categoryName(spotlight.categorySlug, language, categories)} | {spotlight.readingTime}
            </p>
            <h2 className="display-font mt-3 text-3xl font-semibold leading-[1.14]">
              {spotlight.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{spotlight.excerpt}</p>
            <Link href={spotlight.href} className="btn-primary mt-5 px-4 py-2 text-sm">
              {t("common.readFull")}
            </Link>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {sideArticles.map((article, index) => (
              <article key={article.title} className={`rounded-3xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}>
                {article.thumbnailUrl || article.coverImageUrl ? (
                  <Image
                    src={article.thumbnailUrl || article.coverImageUrl || ""}
                    alt={article.title}
                    width={900}
                    height={224}
                    className="mb-3 h-28 w-full rounded-xl object-cover"
                    unoptimized
                  />
                ) : null}
                <p className="section-kicker">
                  {categoryName(article.categorySlug, language, categories)} | {article.readingTime}
                </p>
                <h3 className="display-font mt-2 text-xl font-semibold leading-snug">{article.title}</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{article.excerpt}</p>
                <Link href={article.href} className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
                  {t("common.readArticle")}
                </Link>
              </article>
            ))}
          </div>
        </section> : null}

        <section className="enter-up enter-delay-3 mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="2222222222" format="auto" />
          </div>
        </section>
      </div>
    </main>
  );
}
