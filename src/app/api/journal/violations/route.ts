import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addViolationLog, listViolationLogs } from "@/lib/server/protection-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const schema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  occurredAt: z.string().min(1),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await listViolationLogs(userId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const payload = await request.json();
    const parsed = schema.parse(payload);
    const item = await addViolationLog(parsed, userId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}
