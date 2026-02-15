import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSimulation, listSimulations } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const simulationResultSchema = z.object({
  versionCode: z.string().min(1),
  breakdown: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  explanation: z
    .object({
      summary: z.string(),
      assumptions: z.array(z.string()),
      formulas: z.array(z.string()),
      warnings: z.array(z.string()),
      nextSteps: z.array(z.string()),
    })
    .optional(),
});

const saveSimulationSchema = z.object({
  calculatorType: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
  result: simulationResultSchema,
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await listSimulations(userId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const payload = await request.json();
    const parsed = saveSimulationSchema.parse(payload);
    const saved = await addSimulation(parsed, userId);
    return NextResponse.json({ ok: true, item: saved });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid simulation save payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
