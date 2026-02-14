import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { deleteArticleBySlug, listArticles, upsertArticle } from "@/lib/server/articles-store";

const articleSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  categorySlug: z.string().min(1),
  readingTime: z.string().min(1),
  lastUpdated: z.string().optional(),
  isActive: z.boolean().optional(),
  access: z.enum(["public", "logged"]).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  content: z.array(z.string().min(1)).min(1),
});

const deleteSchema = z.object({
  slug: z.string().min(1),
});

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await listArticles();
  return NextResponse.json({ ok: true, items });
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
    const payload = await request.json();
    const parsed = articleSchema.parse(payload);
    const item = await upsertArticle(parsed);
    await addAdminAuditEvent({
      action: "admin_article_upsert",
      status: "success",
      meta: { slug: item.slug, categorySlug: item.categorySlug },
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    await addAdminAuditEvent({
      action: "admin_article_upsert",
      status: "failed",
      meta: { error: error instanceof Error ? error.message : "invalid_payload" },
    });
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const payload = await request.json();
    const parsed = deleteSchema.parse(payload);
    const deleted = await deleteArticleBySlug(parsed.slug);
    await addAdminAuditEvent({
      action: "admin_article_delete",
      status: deleted ? "success" : "failed",
      meta: { slug: parsed.slug },
    });
    return NextResponse.json({ ok: deleted });
  } catch (error) {
    await addAdminAuditEvent({
      action: "admin_article_delete",
      status: "failed",
      meta: { error: error instanceof Error ? error.message : "invalid_payload" },
    });
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}
