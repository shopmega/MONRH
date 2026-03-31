import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  annualIncomeTaxInputSchema,
  simulateAnnualIncomeTax,
} from "@/lib/calculators/annual-income-tax";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("annual_income_tax");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = annualIncomeTaxInputSchema.parse(payload);
    const result = simulateAnnualIncomeTax(input);
    return NextResponse.json({ ok: true, calculatorType: "annual_income_tax", result });
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

