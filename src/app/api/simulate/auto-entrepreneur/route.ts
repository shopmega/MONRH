import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { autoEntrepreneurInputSchema, simulateAutoEntrepreneur } from "@/lib/calculators/auto-entrepreneur";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("auto_entrepreneur");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = autoEntrepreneurInputSchema.parse(payload);
    const result = simulateAutoEntrepreneur(input);
    return NextResponse.json({ ok: true, calculatorType: "auto_entrepreneur", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
