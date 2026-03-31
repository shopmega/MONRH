import type { Category } from "@/lib/content/home-content";
import type { Article } from "@/lib/content/home-content";

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function deriveCategoriesFromArticles(articles: Article[]): Category[] {
  const grouped = articles.reduce<
    Record<string, { count: number; latestExcerpt: string }>
  >((acc, article) => {
    if (!acc[article.categorySlug]) {
      acc[article.categorySlug] = {
        count: 0,
        latestExcerpt: article.excerpt,
      };
    }
    acc[article.categorySlug].count += 1;
    if (!acc[article.categorySlug].latestExcerpt) {
      acc[article.categorySlug].latestExcerpt = article.excerpt;
    }
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([slug, meta]) => ({
      slug,
      name: toTitleCase(slug),
      count: meta.count,
      description: meta.latestExcerpt || "Articles juridiques dans cette categorie.",
      href: `/bibliotheque/${slug}`,
    }));
}

