import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  unpaidOvertimeRecoveryInputSchema,
  simulateUnpaidOvertimeRecovery,
} from "@/lib/calculators/unpaid-overtime-recovery";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("unpaid_overtime_recovery");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = unpaidOvertimeRecoveryInputSchema.parse(payload);
    const result = simulateUnpaidOvertimeRecovery(input);
    return NextResponse.json({
      ok: true,
      calculatorType: "unpaid_overtime_recovery",
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

