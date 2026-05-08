import { NextRequest, NextResponse } from "next/server";
import { getCompanySalaryBenchmarks } from "@/lib/avis-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await context.params;
  const companyId = String(params.id || "").trim();

  if (!companyId) {
    return NextResponse.json(
      { companyId: null, salaryBenchmarks: null, error: "Invalid company id" },
      { status: 400 },
    );
  }

  try {
    const result = await getCompanySalaryBenchmarks(companyId);
    return NextResponse.json(result, { status: result.salaryBenchmarks ? 200 : 404 });
  } catch (error) {
    console.error("[reviewly/companies/:id/salary-benchmarks]", error);
    return NextResponse.json(
      { companyId: null, salaryBenchmarks: null, error: "Company salary benchmarks temporarily unavailable" },
      { status: 502 },
    );
  }
}
