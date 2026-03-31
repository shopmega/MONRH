import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { listArticles, upsertArticle } from "@/lib/server/articles-store";

type CategoryStat = {
  slug: string;
  count: number;
};

function buildCategoryStats() {
  return listArticles().then((articles) => {
    const counts = articles.reduce<Record<string, number>>((acc, article) => {
      const slug = article.categorySlug.trim();
      if (!slug) return acc;
      acc[slug] = (acc[slug] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count) as CategoryStat[];
  });
}

const categoryActionSchema = z.object({
  fromSlug: z.string().min(1),
  toSlug: z.string().min(1),
});

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await buildCategoryStats();
  return NextResponse.json({ ok: true, items, count: items.length });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = categoryActionSchema.parse(await request.json());
    const fromSlug = payload.fromSlug.trim();
    const toSlug = payload.toSlug.trim();
    if (fromSlug === toSlug) {
      return NextResponse.json({ ok: false, error: "same_slug" }, { status: 400 });
    }

    const articles = await listArticles();
    const impacted = articles.filter((item) => item.categorySlug === fromSlug);
    let updated = 0;

    for (const article of impacted) {
      await upsertArticle({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        categorySlug: toSlug,
        readingTime: article.readingTime,
        lastUpdated: article.lastUpdated,
        isActive: article.isActive ?? true,
        access: article.access ?? "public",
        thumbnailUrl: article.thumbnailUrl ?? "",
        coverImageUrl: article.coverImageUrl ?? "",
        content: article.content,
      });
      updated += 1;
    }

    await addAdminAuditEvent({
      action: "admin_categories_merge",
      status: "success",
      meta: { fromSlug, toSlug, updated },
    });

    const items = await buildCategoryStats();
    return NextResponse.json({ ok: true, updated, items, count: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await addAdminAuditEvent({
      action: "admin_categories_merge",
      status: "failed",
      meta: { error: message },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

