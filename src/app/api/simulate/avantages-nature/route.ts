import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { avantagesNatureInputSchema, simulateAvantagesNature } from "@/lib/calculators/avantages-nature";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("avantages_nature");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = avantagesNatureInputSchema.parse(payload);
    const result = simulateAvantagesNature(input);
    return NextResponse.json({ ok: true, calculatorType: "avantages_nature", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
