import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { freelancePricingInputSchema, simulateFreelancePricing } from "@/lib/calculators/freelance-pricing";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("freelance_pricing");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = freelancePricingInputSchema.parse(payload);
    const result = simulateFreelancePricing(input);
    return NextResponse.json({ ok: true, calculatorType: "freelance_pricing", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
