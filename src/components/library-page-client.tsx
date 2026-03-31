"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { AdSlot } from "@/components/ad-slot";
import { type Article } from "@/lib/content/home-content";

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
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
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

        <section className="mt-5">
          <p className="section-kicker pl-1">{t("common.partner")}</p>
          <div className="soft-card mt-2 rounded-3xl p-3">
            <AdSlot slot="3333333333" format="auto" />
          </div>
        </section>

        <section className="mt-5">
          <h2 className="display-font text-3xl font-semibold">Articles</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {articles.map((article, index) => (
              <article
                key={article.slug}
                className={`rounded-3xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
              >
                {article.thumbnailUrl || article.coverImageUrl ? (
                  <Image
                    src={article.thumbnailUrl || article.coverImageUrl || ""}
                    alt={article.title}
                    width={900}
                    height={288}
                    className="mb-3 h-36 w-full rounded-2xl object-cover"
                    unoptimized
                  />
                ) : null}
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
