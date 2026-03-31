import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { loanCapacityInputSchema, simulateLoanCapacity } from "@/lib/calculators/loan-capacity";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("loan_capacity");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = loanCapacityInputSchema.parse(payload);
    const result = simulateLoanCapacity(input);
    return NextResponse.json({ ok: true, calculatorType: "loan_capacity", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
