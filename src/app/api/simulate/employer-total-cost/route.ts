import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  employerTotalCostInputSchema,
  simulateEmployerTotalCost,
} from "@/lib/calculators/employer-total-cost";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("employer_total_cost");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = employerTotalCostInputSchema.parse(payload);
    const result = simulateEmployerTotalCost(input);
    return NextResponse.json({ ok: true, calculatorType: "employer_total_cost", result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid simulation payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

