import { NextResponse } from "next/server";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";

export async function GET() {
  try {
    const items = await listDocumentTemplates();
    return NextResponse.json({
      ok: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("[api/documents/templates] failure:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "templates_list_failed",
      },
      { status: 500 }
    );
  }
}
