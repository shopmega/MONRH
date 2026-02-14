import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addOvertimeLog, listOvertimeLogs } from "@/lib/server/protection-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const schema = z.object({
  workDate: z.string().min(1),
  hoursDay: z.number().min(0),
  hoursNight: z.number().min(0),
  hoursWeekend: z.number().min(0),
  hoursHoliday: z.number().min(0),
  proofUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await listOvertimeLogs(userId);
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
    const item = await addOvertimeLog(parsed, userId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }
}
