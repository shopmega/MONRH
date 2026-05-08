"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { PartnerAdSection } from "@/components/partner-ad-section";
import { type Article } from "@/lib/content/home-content";

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

function categoryName(slug: string): string {
  return slug.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LibraryPageClient({ initialArticles }: { initialArticles: Article[] }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category") ?? "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(requestedCategory);

  const categoryEntries = useMemo(() => {
    const counts = initialArticles.reduce<Record<string, number>>((acc, article) => {
      acc[article.categorySlug] = (acc[article.categorySlug] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [initialArticles]);

  const articles = useMemo(
    () =>
      selectedCategory === "all"
        ? initialArticles
        : initialArticles.filter((article) => article.categorySlug === selectedCategory),
    [initialArticles, selectedCategory],
  );

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("libraryPage.kicker")}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            {t("libraryPage.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {t("libraryPage.description")}
          </p>
        </section>

        <section className="mt-4 soft-card rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("common.category")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedCategory === "all" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"}`}
            >
              {t("common.all")} ({initialArticles.length})
            </button>
            {categoryEntries.map(([slug, count]) => (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedCategory(slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedCategory === slug ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"}`}
              >
                {categoryName(slug)} ({count})
              </button>
            ))}
          </div>
        </section>

        <PartnerAdSection slot="3333333333" />

        <section className="mt-5">
          <h2 className="display-font text-3xl font-semibold">Articles</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <article
                key={article.slug}
                className={`rounded-3xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
              >
                <div className="mb-3 h-36 w-full">
                  {(article.thumbnailUrl || article.coverImageUrl) ? (
                    <div className="relative w-full h-full">
                      <SafeImage
                        src={article.thumbnailUrl || article.coverImageUrl || ""}
                        alt={article.title}
                        width={900}
                        height={288}
                        className="h-36 w-full rounded-2xl object-cover border border-[var(--line)]"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <ImagePlaceholder className="h-36 w-full rounded-2xl" />
                  )}
                </div>
                <p className="section-kicker">
                  {article.lastUpdated} | {article.readingTime}
                </p>
                <h3 className="display-font mt-2 text-2xl font-semibold leading-tight">{article.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{article.excerpt}</p>
                <Link href={article.href} className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
                  {t("common.readArticle")}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
