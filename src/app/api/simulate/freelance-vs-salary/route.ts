import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { freelanceVsSalaryInputSchema, simulateFreelanceVsSalary } from "@/lib/calculators/freelance-vs-salary";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("freelance_vs_salary");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = freelanceVsSalaryInputSchema.parse(payload);
    const result = simulateFreelanceVsSalary(input);
    return NextResponse.json({ ok: true, calculatorType: "freelance_vs_salary", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
