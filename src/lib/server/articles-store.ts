/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Article } from "@/lib/content/home-content";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    isActive: article.isActive ?? true,
    access: article.access ?? "public",
    href: `/articles/${article.slug}`,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toArticleRow(article: Article) {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category_slug: article.categorySlug,
    reading_time: article.readingTime,
    last_updated: article.lastUpdated,
    content_blocks: article.content,
    is_active: article.isActive ?? true,
    access: article.access ?? "public",
    thumbnail_url: article.thumbnailUrl ?? null,
    cover_image_url: article.coverImageUrl ?? null,
  };
}

export async function listArticles(): Promise<Article[]> {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("articles")
    .select(
      "slug, title, excerpt, category_slug, reading_time, last_updated, content_blocks, is_active, access, thumbnail_url, cover_image_url",
    )
    .order("last_updated", { ascending: false })
    .limit(1000);
  if (error || !data) {
    throw new Error(error?.message ?? "articles_list_failed");
  }
  return (data as Array<Record<string, unknown>>).map((row) =>
    normalizeArticle({
      slug: String(row.slug),
      title: String(row.title),
      excerpt: String(row.excerpt),
      categorySlug: String(row.category_slug),
      readingTime: String(row.reading_time),
      lastUpdated: String(row.last_updated),
      content: Array.isArray(row.content_blocks)
        ? row.content_blocks.map((item) => String(item))
        : [],
      isActive: Boolean(row.is_active),
      access: row.access === "logged" ? "logged" : "public",
      thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
      coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : undefined,
      href: `/articles/${String(row.slug)}`,
    }),
  );
}

export async function getArticleBySlugFromStore(slug: string): Promise<Article | undefined> {
  const articles = await listArticles();
  return articles.find((item) => item.slug === slug);
}

export async function upsertArticle(input: {
  slug?: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  readingTime: string;
  lastUpdated?: string;
  isActive?: boolean;
  access?: "public" | "logged";
  thumbnailUrl?: string;
  coverImageUrl?: string;
  content: string[];
}): Promise<Article> {
  const targetSlug = input.slug && input.slug.trim().length > 0 ? input.slug : slugify(input.title);
  const next: Article = normalizeArticle({
    slug: targetSlug,
    title: input.title,
    excerpt: input.excerpt,
    categorySlug: input.categorySlug,
    readingTime: input.readingTime,
    lastUpdated: input.lastUpdated ?? new Date().toISOString().slice(0, 10),
    isActive: input.isActive ?? true,
    access: input.access ?? "public",
    thumbnailUrl: input.thumbnailUrl?.trim() ? input.thumbnailUrl.trim() : undefined,
    coverImageUrl: input.coverImageUrl?.trim() ? input.coverImageUrl.trim() : undefined,
    content: input.content,
    href: `/articles/${targetSlug}`,
  });
  const supabase = getSupabaseAdminClient() as any;
  const { error } = await supabase.from("articles").upsert(toArticleRow(next), { onConflict: "slug" });
  if (error) {
    throw new Error(error.message ?? "article_upsert_failed");
  }
  return next;
}

export async function deleteArticleBySlug(slug: string) {
  const supabase = getSupabaseAdminClient() as any;
  const { error, count } = await supabase
    .from("articles")
    .delete({ count: "exact" })
    .eq("slug", slug);
  if (error) {
    throw new Error(error.message ?? "article_delete_failed");
  }
  return Boolean((count ?? 0) > 0);
}

export function canAccessArticle(article: Article, userAuthenticated: boolean): boolean {
  const isActive = article.isActive ?? true;
  const access = article.access ?? "public";
  if (!isActive) return false;
  if (access === "logged" && !userAuthenticated) return false;
  return true;
}
