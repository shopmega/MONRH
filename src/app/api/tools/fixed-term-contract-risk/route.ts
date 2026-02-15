import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  assessFixedTermContractRisk,
  fixedTermContractRiskInputSchema,
} from "@/lib/tools/fixed-term-contract-risk";
import { recordToolUsage } from "@/lib/server/tool-usage-history";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("fixed_term_contract_risk");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = fixedTermContractRiskInputSchema.parse(payload);
    const result = assessFixedTermContractRisk(input);

    await recordToolUsage("fixed_term_contract_risk", input, result);

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
