import { NextResponse } from "next/server";
import { getSimulationById } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const item = await getSimulationById(id, userId);
  if (!item) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item });
}
