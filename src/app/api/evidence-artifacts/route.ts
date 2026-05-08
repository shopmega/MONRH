import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/user-session";
import { listEvidenceArtifacts } from "@/lib/server/verification-store";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const caseId = request.nextUrl.searchParams.get("caseId")?.trim() || undefined;
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || undefined;
  const documentId = request.nextUrl.searchParams.get("documentId")?.trim() || undefined;
  const limitParam = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : undefined;

  const items = await listEvidenceArtifacts(userId, {
    caseId,
    companyId,
    documentId,
    limit,
  });

  return NextResponse.json({ ok: true, items });
}
