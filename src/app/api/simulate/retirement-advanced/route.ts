import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { retirementAdvancedInputSchema, simulateRetirementAdvanced } from "@/lib/calculators/retirement-advanced";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("retirement_advanced");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = retirementAdvancedInputSchema.parse(payload);
    const result = simulateRetirementAdvanced(input);
    return NextResponse.json({ ok: true, calculatorType: "retirement_advanced", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
