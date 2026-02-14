import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  maternityLeaveInputSchema,
  simulateMaternityLeave,
} from "@/lib/calculators/maternity-leave";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("maternity_leave");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = maternityLeaveInputSchema.parse(payload);
    const result = simulateMaternityLeave(input);
    return NextResponse.json({ ok: true, calculatorType: "maternity_leave", result });
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

