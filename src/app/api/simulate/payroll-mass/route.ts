import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { payrollMassInputSchema, simulatePayrollMass } from "@/lib/calculators/payroll-mass";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("payroll_mass");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = payrollMassInputSchema.parse(payload);
    const result = simulatePayrollMass(input);
    return NextResponse.json({ ok: true, calculatorType: "payroll_mass", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
