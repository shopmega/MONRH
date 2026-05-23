import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getEmployerWorkspaceSnapshot,
  upsertEmployerWorkspaceSnapshot,
} from "@/lib/server/employer-workspace-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const workspaceSnapshotSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().min(1),
  storage: z.record(z.string(), z.string()),
});

const saveWorkspaceSchema = z.object({
  workspaceKey: z.string().min(1).max(80).optional(),
  snapshot: workspaceSnapshotSchema,
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const workspaceKey = request.nextUrl.searchParams.get("workspaceKey") || "default";
    const item = await getEmployerWorkspaceSnapshot(userId, workspaceKey);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "workspace_snapshot_unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = saveWorkspaceSchema.parse(await request.json());
    const item = await upsertEmployerWorkspaceSnapshot(userId, payload.snapshot, payload.workspaceKey ?? "default");
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "workspace_snapshot_save_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

export const PUT = POST;
