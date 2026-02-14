import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  publicHolidayCompensationInputSchema,
  simulatePublicHolidayCompensation,
} from "@/lib/calculators/public-holiday-compensation";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("public_holiday_compensation");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = publicHolidayCompensationInputSchema.parse(payload);
    const result = simulatePublicHolidayCompensation(input);
    return NextResponse.json({
      ok: true,
      calculatorType: "public_holiday_compensation",
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

