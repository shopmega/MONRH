import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listCases, listDocuments, listSimulations } from "@/lib/server/app-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplatesWithOptions } from "@/lib/server/document-templates-store";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [simulations, documents, cases, config, articles, documentTemplates] = await Promise.all([
    listSimulations(),
    listDocuments(),
    listCases(),
    readAdminConfig(),
    listArticles(),
    listDocumentTemplatesWithOptions({ includeInactive: true }),
  ]);

  const evidenceMetrics = cases.reduce(
    (acc, item) => {
      const timeline = item.timeline as Record<string, unknown>;
      const externalEvidence = Array.isArray(timeline.externalEvidence) ? timeline.externalEvidence : [];
      const archivedExternalEvidence = Array.isArray(timeline.archivedExternalEvidence)
        ? timeline.archivedExternalEvidence
        : [];
      acc.activeEvidence += externalEvidence.length;
      acc.archivedEvidence += archivedExternalEvidence.length;
      return acc;
    },
    { activeEvidence: 0, archivedEvidence: 0 },
  );

  return NextResponse.json({
    ok: true,
    metrics: {
      simulations: simulations.length,
      documents: documents.length,
      cases: cases.length,
      activeEvidence: evidenceMetrics.activeEvidence,
      archivedEvidence: evidenceMetrics.archivedEvidence,
      articleTemplates: articles.length,
      documentTemplates: documentTemplates.length,
      simulatorAdStepEnabled: config.simulatorAdStepEnabled,
      documentAdStepEnabled: config.documentAdStepEnabled,
      evidenceGovernance: config.evidenceGovernance,
      configUpdatedAt: config.updatedAt,
    },
  });
}
