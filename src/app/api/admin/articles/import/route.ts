import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { upsertArticle } from "@/lib/server/articles-store";

const articleImportItemBaseSchema = z.object({
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
  content: z.array(z.string().min(1)).optional(),
  contentText: z.string().optional(),
});

const articleImportSchema = z.object({
  items: z.array(articleImportItemBaseSchema).min(1).max(500),
});

function mapArticleImportError(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown_error";
  if (message.includes("article_upsert_failed")) {
    return "article_upsert_failed";
  }
  return message;
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
    const payload = articleImportSchema.parse(await request.json());
    let imported = 0;
    const errors: Array<{ index: number; title?: string; error: string }> = [];

    for (let index = 0; index < payload.items.length; index += 1) {
      const item = payload.items[index];
      try {
        const normalizedContent =
          Array.isArray(item.content) && item.content.length > 0
            ? item.content
            : (item.contentText ?? "")
              .split(/\r?\n\s*\r?\n/g)
              .map((block) => block.replace(/\s+/g, " ").trim())
              .filter(Boolean);

        if (normalizedContent.length === 0) {
          throw new Error("missing_content");
        }

        await upsertArticle({
          ...item,
          content: normalizedContent,
        });
        imported += 1;
      } catch (error) {
        errors.push({
          index,
          title: item.title,
          error: mapArticleImportError(error),
        });
      }
    }

    await addAdminAuditEvent({
      action: "admin_article_import",
      status: errors.length > 0 ? "failed" : "success",
      meta: {
        total: payload.items.length,
        imported,
        failed: errors.length,
      },
    });

    return NextResponse.json({
      ok: true,
      total: payload.items.length,
      imported,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    const mappedError = mapArticleImportError(error);
    await addAdminAuditEvent({
      action: "admin_article_import",
      status: "failed",
      meta: { error: mappedError },
    });
    return NextResponse.json({ ok: false, error: mappedError }, { status: 400 });
  }
}
