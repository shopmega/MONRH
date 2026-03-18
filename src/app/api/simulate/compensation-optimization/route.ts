import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { compensationOptimizationInputSchema, simulateCompensationOptimization } from "@/lib/calculators/compensation-optimization";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("compensation_optimization");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = compensationOptimizationInputSchema.parse(payload);
    const result = simulateCompensationOptimization(input);
    return NextResponse.json({ ok: true, calculatorType: "compensation_optimization", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
