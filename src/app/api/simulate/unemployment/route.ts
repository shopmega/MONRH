import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { unemploymentInputSchema, simulateUnemployment } from "@/lib/calculators/unemployment";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("unemployment");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = unemploymentInputSchema.parse(payload);
    const result = simulateUnemployment(input);
    return NextResponse.json({ ok: true, calculatorType: "unemployment", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
