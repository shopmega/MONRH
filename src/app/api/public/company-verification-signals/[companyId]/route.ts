import { NextResponse } from "next/server";
import { getCompanyVerificationSignals } from "@/lib/server/verification-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await context.params;
  const resolvedCompanyId = companyId.trim();

  if (!resolvedCompanyId) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_company_id",
      },
      { status: 400 },
    );
  }

  const signals = await getCompanyVerificationSignals(resolvedCompanyId);
  return NextResponse.json({
    ok: true,
    signals,
    meta: {
      contractVersion: "company.verification-signals.v1",
      source: "monrh_verification_bridge",
    },
  });
}
