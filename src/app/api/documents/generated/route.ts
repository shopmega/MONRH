import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDocument, listDocuments } from "@/lib/server/app-store";
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
