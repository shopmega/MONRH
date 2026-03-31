import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLinkedCompaniesFromValues, getUnmatchedCompanyNames } from "@/lib/documents/company-fields";
import { addDocument, attachDocumentToCase, listDocuments } from "@/lib/server/app-store";
import { addSuggestedCompanies } from "@/lib/server/suggested-companies-store";
import { getDocumentTemplateById } from "@/lib/server/document-templates-store";
import { getCurrentUserId } from "@/lib/server/user-session";
import { registerGeneratedDocumentEvidence } from "@/lib/server/verification-store";

const saveDocumentSchema = z.object({
  templateId: z.string().min(1),
  templateTitle: z.string().min(1),
  values: z.record(z.string(), z.string()),
  preview: z.string().min(1),
  caseId: z.string().optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await listDocuments(userId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const payload = await request.json();
    const parsed = saveDocumentSchema.parse(payload);
    const saved = await addDocument(parsed, userId);
    let evidenceRegistration:
      | Awaited<ReturnType<typeof registerGeneratedDocumentEvidence>>
      | null = null;

    if (parsed.caseId) {
      await attachDocumentToCase(
        {
          caseId: parsed.caseId,
          document: {
            id: saved.id,
            createdAt: saved.createdAt,
            templateId: saved.templateId,
            templateTitle: saved.templateTitle,
          },
        },
        userId,
      );
    }

    const template = await getDocumentTemplateById(parsed.templateId);
    const templateFields = template?.fields ?? [];
    const linkedCompanies = getLinkedCompaniesFromValues(templateFields, parsed.values);
    try {
      evidenceRegistration = await registerGeneratedDocumentEvidence({
        userId,
        document: {
          id: saved.id,
          createdAt: saved.createdAt,
          templateId: saved.templateId,
          templateTitle: saved.templateTitle,
        },
        caseId: parsed.caseId,
        linkedCompanies: linkedCompanies.map((item) => ({
          fieldId: item.fieldId,
          companyId: item.companyId,
          companyName: item.companyName,
          slug: item.slug,
        })),
      });
    } catch (registrationError) {
      console.error("[documents.generated] evidence registration failed", registrationError);
    }

    // Store company names that were typed but not selected from Reviewly (for adding to Avis API)
    if (templateFields.length > 0) {
      const unmatched = getUnmatchedCompanyNames(templateFields, parsed.values);
      if (unmatched.length > 0) {
        await addSuggestedCompanies(
          unmatched.map(({ fieldId, companyName }) => ({
            userId,
            documentId: saved.id,
            templateId: parsed.templateId,
            fieldId,
            companyName,
          })),
        );
      }
    }

    return NextResponse.json({
      ok: true,
      item: saved,
      evidenceArtifacts: evidenceRegistration?.evidenceArtifacts ?? [],
      verificationCandidates: evidenceRegistration?.verifications ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid document save payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
