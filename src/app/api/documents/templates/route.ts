import { NextResponse } from "next/server";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";

export async function GET() {
  const items = await listDocumentTemplates();
  return NextResponse.json({
    ok: true,
    count: items.length,
    items,
  });
}
