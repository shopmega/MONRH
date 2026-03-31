import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  seniorityGrowthInputSchema,
  simulateSeniorityGrowth,
} from "@/lib/calculators/seniority-growth";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("seniority_growth");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = seniorityGrowthInputSchema.parse(payload);
    const result = simulateSeniorityGrowth(input);
    return NextResponse.json({ ok: true, calculatorType: "seniority_growth", result });
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

