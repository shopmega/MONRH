import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { sickLeaveInputSchema, simulateSickLeave } from "@/lib/calculators/sick-leave";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("sick_leave");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = sickLeaveInputSchema.parse(payload);
    const result = simulateSickLeave(input);
    return NextResponse.json({ ok: true, calculatorType: "sick_leave", result });
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

