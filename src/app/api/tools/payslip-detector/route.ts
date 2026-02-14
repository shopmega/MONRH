import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import { z } from "zod";
import { simulateNetGross } from "@/lib/calculators/net-gross";
import { getSmigRulesByDate } from "@/lib/rules/default-rules";

const schema = z.object({
  grossSalary: z.number().positive(),
  netSalaryReported: z.number().nonnegative(),
  cnssEmployeeReported: z.number().nonnegative(),
  incomeTaxReported: z.number().nonnegative(),
  overtimePaidReported: z.number().nonnegative().default(0),
  overtimeExpected: z.number().nonnegative().default(0),
  calculationDate: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("payslip_detector");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = schema.parse(payload);

    const simulation = simulateNetGross({
      direction: "gross_to_net",
      amount: input.grossSalary,
      calculationDate: input.calculationDate,
      includeCimr: false,
      cimrRate: 0.06,
    });

    const breakdown = simulation.breakdown;
    const expectedNet = typeof breakdown.net === "number" ? breakdown.net : 0;
    const expectedCnss = typeof breakdown.cnssEmployee === "number" ? breakdown.cnssEmployee : 0;
    const expectedTax = typeof breakdown.incomeTax === "number" ? breakdown.incomeTax : 0;
    const smigRules = getSmigRulesByDate(input.calculationDate);
    const minSmig = smigRules.smigHourlyMad * smigRules.referenceHoursPerMonth;

    const issues: Array<{
      code: string;
      severity: "low" | "medium" | "high";
      message: string;
      expected?: number;
      reported?: number;
      gap?: number;
    }> = [];

    const netGap = Math.round((expectedNet - input.netSalaryReported) * 100) / 100;
    if (Math.abs(netGap) > 10) {
      issues.push({
        code: "NET_MISMATCH",
        severity: Math.abs(netGap) > 100 ? "high" : "medium",
        message: "Ecart net significatif detecte.",
        expected: expectedNet,
        reported: input.netSalaryReported,
        gap: netGap,
      });
    }

    const cnssGap = Math.round((expectedCnss - input.cnssEmployeeReported) * 100) / 100;
    if (Math.abs(cnssGap) > 5) {
      issues.push({
        code: "CNSS_MISMATCH",
        severity: Math.abs(cnssGap) > 50 ? "high" : "medium",
        message: "Cotisation CNSS salarie incoherente.",
        expected: expectedCnss,
        reported: input.cnssEmployeeReported,
        gap: cnssGap,
      });
    }

    const taxGap = Math.round((expectedTax - input.incomeTaxReported) * 100) / 100;
    if (Math.abs(taxGap) > 5) {
      issues.push({
        code: "TAX_MISMATCH",
        severity: Math.abs(taxGap) > 80 ? "high" : "medium",
        message: "IR retenu different du calcul attendu.",
        expected: expectedTax,
        reported: input.incomeTaxReported,
        gap: taxGap,
      });
    }

    if (input.grossSalary < minSmig) {
      issues.push({
        code: "BELOW_SMIG",
        severity: "high",
        message: "Salaire brut inferieur au seuil SMIG estime.",
        expected: minSmig,
        reported: input.grossSalary,
        gap: Math.round((minSmig - input.grossSalary) * 100) / 100,
      });
    }

    if (input.overtimeExpected > input.overtimePaidReported) {
      issues.push({
        code: "OVERTIME_UNDERPAID",
        severity: "medium",
        message: "Montant heures supplementaires potentiellement sous-paye.",
        expected: input.overtimeExpected,
        reported: input.overtimePaidReported,
        gap: Math.round((input.overtimeExpected - input.overtimePaidReported) * 100) / 100,
      });
    }

    const score = Math.max(
      0,
      100 -
        issues.reduce((acc, issue) => {
          if (issue.severity === "high") return acc + 30;
          if (issue.severity === "medium") return acc + 18;
          return acc + 8;
        }, 0),
    );

    return NextResponse.json({
      ok: true,
      result: {
        riskScore: score,
        expected: {
          netSalary: expectedNet,
          cnssEmployee: expectedCnss,
          incomeTax: expectedTax,
          smigEstimate: minSmig,
        },
        issues,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}

