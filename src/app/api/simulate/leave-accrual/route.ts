import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  leaveAccrualInputSchema,
  simulateLeaveAccrual,
} from "@/lib/calculators/leave-accrual";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("leave_accrual");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = leaveAccrualInputSchema.parse(payload);
    const result = simulateLeaveAccrual(input);

    return NextResponse.json({
      ok: true,
      calculatorType: "leave_accrual",
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

