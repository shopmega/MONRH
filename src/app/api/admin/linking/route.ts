import { NextRequest, NextResponse } from "next/server";
import { deleteLinkTargets, readLinkMap, upsertLinkTargets, type LinkSourceType, type LinkTargets } from "@/lib/linking/link-map";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { addAdminAuditEvent } from "@/lib/server/admin-audit-store";
import { listDocumentTemplatesWithOptions } from "@/lib/server/document-templates-store";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { listArticles } from "@/lib/server/articles-store";
import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

function parseSourceType(value: string | undefined): LinkSourceType | null {
  if (value === "article" || value === "simulator" || value === "document") {
    return value;
  }
  return null;
}

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [map, articles, documentTemplates] = await Promise.all([
    readLinkMap(),
    listArticles(),
    listDocumentTemplatesWithOptions({ includeInactive: true }),
  ]);
  return NextResponse.json({
    ok: true,
    map,
    catalog: {
      articles: articles.map((item) => ({ id: item.slug, label: item.title, href: item.href })),
      tools: TOOL_CATALOG.map((item) => ({ id: item.id, label: item.label, href: item.href })),
      documents: documentTemplates.map((item) => ({ id: item.id, label: item.title, href: item.href })),
    },
  });
}

export async function PUT(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    sourceType?: string;
    sourceId?: string;
    targets?: Partial<LinkTargets>;
  };
  const sourceType = parseSourceType(body.sourceType);
  if (!sourceType || !body.sourceId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const map = await upsertLinkTargets({
    sourceType,
    sourceId: body.sourceId,
    targets: body.targets ?? {},
  });

  await addAdminAuditEvent({
    action: "admin_linking_upsert",
    status: "success",
    meta: { sourceType, sourceId: body.sourceId },
  });

  return NextResponse.json({ ok: true, map });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { sourceType?: string; sourceId?: string };
  const sourceType = parseSourceType(body.sourceType);
  if (!sourceType || !body.sourceId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const map = await deleteLinkTargets({ sourceType, sourceId: body.sourceId });
  await addAdminAuditEvent({
    action: "admin_linking_delete",
    status: "success",
    meta: { sourceType, sourceId: body.sourceId },
  });
  return NextResponse.json({ ok: true, map });
}
