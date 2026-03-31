import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addCase, listCases } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const saveCaseSchema = z.object({
  caseType: z.string().min(1),
  title: z.string().min(1),
  status: z.string().min(1).default("open"),
  companyId: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  sourceSimulationId: z.string().nullable().optional(),
  timeline: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const items = await listCases(userId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = saveCaseSchema.parse(payload);
    const saved = await addCase(
      {
        ...parsed,
        companyId: parsed.companyId ?? null,
        companyName: parsed.companyName ?? null,
        sourceSimulationId: parsed.sourceSimulationId ?? null,
      },
      userId,
    );
    return NextResponse.json({ ok: true, item: saved });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid case save payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
