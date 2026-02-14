import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { z } from "zod";

const schema = z.object({
  hasWrittenContract: z.boolean(),
  declaredToCnss: z.boolean(),
  receivesPayslip: z.boolean(),
  paidOvertimeWhenApplicable: z.boolean(),
  paidOnTime: z.boolean(),
  hasProofArchive: z.boolean(),
});

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("compliance_risk_score");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = schema.parse(payload);

    const deductions = [
      input.hasWrittenContract ? 0 : 18,
      input.declaredToCnss ? 0 : 22,
      input.receivesPayslip ? 0 : 14,
      input.paidOvertimeWhenApplicable ? 0 : 16,
      input.paidOnTime ? 0 : 18,
      input.hasProofArchive ? 0 : 12,
    ];

    const riskScore = Math.min(100, deductions.reduce((acc, value) => acc + value, 0));
    const level = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
    const recommendationCodes = [
      !input.hasWrittenContract ? "contract" : null,
      !input.declaredToCnss ? "cnss" : null,
      !input.receivesPayslip ? "payslip" : null,
      !input.paidOvertimeWhenApplicable ? "overtime" : null,
      !input.paidOnTime ? "paid_on_time" : null,
      !input.hasProofArchive ? "archive" : null,
    ].filter(Boolean);

    return NextResponse.json({
      ok: true,
      result: {
        riskScore,
        level,
        recommendationCodes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}

