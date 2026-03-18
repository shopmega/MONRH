import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { payslipInputSchema, generatePayslip } from "@/lib/calculators/payslip";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("payslip");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = payslipInputSchema.parse(payload);
    const result = generatePayslip(input);
    return NextResponse.json({ ok: true, calculatorType: "payslip", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
