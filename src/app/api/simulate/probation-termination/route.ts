import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  probationTerminationInputSchema,
  simulateProbationTermination,
} from "@/lib/calculators/probation-termination";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("probation_termination");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = probationTerminationInputSchema.parse(payload);
    const result = simulateProbationTermination(input);
    return NextResponse.json({
      ok: true,
      calculatorType: "probation_termination",
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

