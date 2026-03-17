import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUnmatchedCompanyNames } from "@/lib/documents/company-fields";
import { addDocument, listDocuments } from "@/lib/server/app-store";
import { addSuggestedCompanies } from "@/lib/server/suggested-companies-store";
import { getDocumentTemplateById } from "@/lib/server/document-templates-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const saveDocumentSchema = z.object({
  templateId: z.string().min(1),
  templateTitle: z.string().min(1),
  values: z.record(z.string(), z.string()),
  preview: z.string().min(1),
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

    // Store company names that were typed but not selected from Reviewly (for adding to Avis API)
    const template = await getDocumentTemplateById(parsed.templateId);
    if (template?.fields?.length) {
      const unmatched = getUnmatchedCompanyNames(template.fields, parsed.values);
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

    return NextResponse.json({ ok: true, item: saved });
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
