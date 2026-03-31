import { NextResponse } from "next/server";
import { listSimulations } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

function latestByType(
  items: Awaited<ReturnType<typeof listSimulations>>,
  calculatorType: string,
) {
  return items.find((item) => item.calculatorType === calculatorType);
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function toBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const simulations = await listSimulations(userId);
  const netGross = latestByType(simulations, "net_gross");
  const leave = latestByType(simulations, "leave_accrual");
  const licenciement = latestByType(simulations, "licenciement");
  const smig = latestByType(simulations, "smig_compliance");
  const unpaidOvertime = latestByType(simulations, "unpaid_overtime_recovery");

  const netBreakdown = (netGross?.result?.breakdown as Record<string, unknown> | undefined) ?? {};
  const leaveBreakdown = (leave?.result?.breakdown as Record<string, unknown> | undefined) ?? {};
  const licBreakdown = (licenciement?.result?.breakdown as Record<string, unknown> | undefined) ?? {};
  const smigBreakdown = (smig?.result?.breakdown as Record<string, unknown> | undefined) ?? {};
  const overtimeBreakdown =
    (unpaidOvertime?.result?.breakdown as Record<string, unknown> | undefined) ?? {};

  return NextResponse.json({
    ok: true,
    snapshot: {
      netSalary: toNumber(netBreakdown.net),
      grossSalary: toNumber(netBreakdown.gross),
      cnssCompliance:
        typeof netBreakdown.cnssEmployee === "number" && netBreakdown.cnssEmployee > 0 ? true : null,
      leaveAccruedDays: toNumber(leaveBreakdown.accrualDays),
      leaveTakenDays: toNumber(leaveBreakdown.usedLeaveDays),
      indemnityIfTerminatedToday: toNumber(licBreakdown.totalEstimated),
      smigCompliance: toBoolean(smigBreakdown.compliant),
      overtimeOwedEstimate: toNumber(overtimeBreakdown.totalClaimAmount),
      updatedAt: new Date().toISOString(),
    },
  });
}
