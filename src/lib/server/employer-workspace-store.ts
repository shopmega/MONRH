/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { EmployerWorkspaceSnapshot } from "@/lib/employer/workspace-snapshot";

export type SavedEmployerWorkspaceSnapshot = {
  id: string;
  workspaceKey: string;
  updatedAt: string;
  payload: EmployerWorkspaceSnapshot;
};

function toSnapshot(row: Record<string, unknown>): SavedEmployerWorkspaceSnapshot {
  return {
    id: String(row.id),
    workspaceKey: String(row.workspace_key),
    updatedAt: String(row.updated_at),
    payload: row.payload as EmployerWorkspaceSnapshot,
  };
}

export async function getEmployerWorkspaceSnapshot(userId: string, workspaceKey = "default") {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_employer_workspaces")
    .select("id, workspace_key, payload, updated_at")
    .eq("user_id", userId)
    .eq("workspace_key", workspaceKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "employer_workspace_get_failed");
  }
  if (!data) return null;
  return toSnapshot(data as Record<string, unknown>);
}

export async function upsertEmployerWorkspaceSnapshot(
  userId: string,
  payload: EmployerWorkspaceSnapshot,
  workspaceKey = "default",
) {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("user_employer_workspaces")
    .upsert(
      {
        user_id: userId,
        workspace_key: workspaceKey,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,workspace_key" },
    )
    .select("id, workspace_key, payload, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "employer_workspace_upsert_failed");
  }

  return toSnapshot(data as Record<string, unknown>);
}
