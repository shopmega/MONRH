import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listDocuments, listSimulations } from "@/lib/server/app-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplatesWithOptions } from "@/lib/server/document-templates-store";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [simulations, documents, config, articles, documentTemplates] = await Promise.all([
    listSimulations(),
    listDocuments(),
    readAdminConfig(),
    listArticles(),
    listDocumentTemplatesWithOptions({ includeInactive: true }),
  ]);

  return NextResponse.json({
    ok: true,
    metrics: {
      simulations: simulations.length,
      documents: documents.length,
      articleTemplates: articles.length,
      documentTemplates: documentTemplates.length,
      simulatorAdStepEnabled: config.simulatorAdStepEnabled,
      documentAdStepEnabled: config.documentAdStepEnabled,
      configUpdatedAt: config.updatedAt,
    },
  });
}
