import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  EMPLOYER_WORKSPACE_MAX_BYTES,
  EMPLOYER_WORKSPACE_MAX_KEYS,
  EMPLOYER_WORKSPACE_MAX_VALUE_BYTES,
  isEmployerStorageKey,
  type EmployerWorkspaceSnapshot,
} from "@/lib/employer/workspace-snapshot";
import {
  getEmployerWorkspaceSnapshot,
  upsertEmployerWorkspaceSnapshot,
} from "@/lib/server/employer-workspace-store";
import { getCurrentUserId } from "@/lib/server/user-session";

const workspaceSnapshotSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().min(1),
  storage: z.record(z.string(), z.string()),
}).superRefine((snapshot, context) => {
  const entries = Object.entries(snapshot.storage);
  if (entries.length > EMPLOYER_WORKSPACE_MAX_KEYS) {
    context.addIssue({
      code: "custom",
      message: `workspace_too_many_keys:${EMPLOYER_WORKSPACE_MAX_KEYS}`,
      path: ["storage"],
    });
  }

  let totalBytes = 0;
  for (const [key, value] of entries) {
    if (!isEmployerStorageKey(key)) {
      context.addIssue({
        code: "custom",
        message: "workspace_key_not_allowed",
        path: ["storage", key],
      });
      continue;
    }

    const valueBytes = Buffer.byteLength(value, "utf8");
    totalBytes += Buffer.byteLength(key, "utf8") + valueBytes;
    if (valueBytes > EMPLOYER_WORKSPACE_MAX_VALUE_BYTES) {
      context.addIssue({
        code: "custom",
        message: `workspace_value_too_large:${EMPLOYER_WORKSPACE_MAX_VALUE_BYTES}`,
        path: ["storage", key],
      });
    }
  }

  if (totalBytes > EMPLOYER_WORKSPACE_MAX_BYTES) {
    context.addIssue({
      code: "custom",
      message: `workspace_snapshot_too_large:${EMPLOYER_WORKSPACE_MAX_BYTES}`,
      path: ["storage"],
    });
  }
}) satisfies z.ZodType<EmployerWorkspaceSnapshot>;

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
