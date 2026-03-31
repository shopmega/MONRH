import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  smigComplianceInputSchema,
  simulateSmigCompliance,
} from "@/lib/calculators/smig-compliance";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("smig_compliance");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = smigComplianceInputSchema.parse(payload);
    const result = simulateSmigCompliance(input);

    return NextResponse.json({
      ok: true,
      calculatorType: "smig_compliance",
      result,
    });
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

