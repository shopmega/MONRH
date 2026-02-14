import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSimulation, listSimulations } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const saveSimulationSchema = z.object({
  calculatorType: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
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
