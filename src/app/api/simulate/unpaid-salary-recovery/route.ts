import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  unpaidSalaryRecoveryInputSchema,
  simulateUnpaidSalaryRecovery,
} from "@/lib/calculators/unpaid-salary-recovery";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("unpaid_salary_recovery");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = unpaidSalaryRecoveryInputSchema.parse(payload);
    const result = simulateUnpaidSalaryRecovery(input);
    return NextResponse.json({
      ok: true,
      calculatorType: "unpaid_salary_recovery",
      result,
    });
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

