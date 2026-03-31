import { NextResponse } from "next/server";
import { z } from "zod";
import { getCaseById, updateCase } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const updateCaseSchema = z.object({
  timeline: z.record(z.string(), z.unknown()),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const item = await getCaseById(id, userId);
  if (!item) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = updateCaseSchema.parse(payload);
    const { id } = await context.params;
    const item = await updateCase({ caseId: id, timeline: parsed.timeline }, userId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid case update payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
