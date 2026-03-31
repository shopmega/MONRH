import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  auditFinalSettlement,
  finalSettlementAuditInputSchema,
} from "@/lib/tools/final-settlement-audit";
import { recordToolUsage } from "@/lib/server/tool-usage-history";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("final_settlement_audit");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = finalSettlementAuditInputSchema.parse(payload);
    const result = auditFinalSettlement(input);

    await recordToolUsage("final_settlement_audit", input, result);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}
