import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { workAccidentInputSchema, simulateWorkAccident } from "@/lib/calculators/work-accident";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("work_accident");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = workAccidentInputSchema.parse(payload);
    const result = simulateWorkAccident(input);
    return NextResponse.json({ ok: true, calculatorType: "work_accident", result });
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

