import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

const ARTICLE_MEDIA_BUCKET = "article-media";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const kindSchema = z.enum(["thumbnail", "cover"]);

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extensionFromMimeOrName(type: string, name: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  const fromName = name.split(".").pop()?.trim().toLowerCase();
  return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : "bin";
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
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const rawKind = formData.get("kind");
    const kind = kindSchema.parse(typeof rawKind === "string" ? rawKind : "");
    const slugRaw = formData.get("slug");
    const slug =
      typeof slugRaw === "string" && slugRaw.trim().length > 0
        ? sanitizeFileName(slugRaw)
        : "article";

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }
    if (!fileEntry.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "invalid_file_type" }, { status: 400 });
    }
    if (fileEntry.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
    }

    const ext = extensionFromMimeOrName(fileEntry.type, fileEntry.name);
    const safeName = sanitizeFileName(fileEntry.name.replace(/\.[^.]+$/, "")) || "image";
    const path = `${kind}/${slug}/${Date.now()}-${randomUUID()}-${safeName}.${ext}`;

    const bytes = Buffer.from(await fileEntry.arrayBuffer());
    const supabase = getSupabaseAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(ARTICLE_MEDIA_BUCKET)
      .upload(path, bytes, {
        contentType: fileEntry.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "article_media_upload_failed");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(ARTICLE_MEDIA_BUCKET).getPublicUrl(path);

    await addAdminAuditEvent({
      action: "admin_article_media_upload",
      status: "success",
      meta: { kind, bucket: ARTICLE_MEDIA_BUCKET, path },
    });

    return NextResponse.json({
      ok: true,
      bucket: ARTICLE_MEDIA_BUCKET,
      path,
      publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "article_media_upload_failed";
    await addAdminAuditEvent({
      action: "admin_article_media_upload",
      status: "failed",
      meta: { error: message },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
