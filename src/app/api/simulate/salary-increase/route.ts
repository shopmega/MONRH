import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { salaryIncreaseInputSchema, simulateSalaryIncrease } from "@/lib/calculators/salary-increase";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("salary_increase");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = salaryIncreaseInputSchema.parse(payload);
    const result = simulateSalaryIncrease(input);
    return NextResponse.json({ ok: true, calculatorType: "salary_increase", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
