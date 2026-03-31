import { NextRequest, NextResponse } from "next/server";
import { requireToolAccessOrResponse } from "@/lib/server/tool-access-enforcement";
import {
  netGrossInputSchema,
  simulateNetGross,
} from "@/lib/calculators/net-gross";

export async function POST(request: NextRequest) {
  const accessDenied = await requireToolAccessOrResponse("net_gross");
  if (accessDenied) return accessDenied;
  try {
    const payload = await request.json();
    const input = netGrossInputSchema.parse(payload);
    const result = simulateNetGross(input);

    return NextResponse.json({
      ok: true,
      calculatorType: "net_gross",
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




