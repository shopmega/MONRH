import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { profitExpenseInputSchema, simulateProfitExpense } from "@/lib/calculators/profit-expense";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("profit_expense");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = profitExpenseInputSchema.parse(payload);
    const result = simulateProfitExpense(input);
    return NextResponse.json({ ok: true, calculatorType: "profit_expense", result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid simulation payload.", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
