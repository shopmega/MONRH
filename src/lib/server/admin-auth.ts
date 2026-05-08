import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicSupabaseAdminClient } from "@/lib/server/supabase-admin";

async function hasAdminTableRoleForClient(userId: string): Promise<boolean> {
  // admin_users is in public schema — use the public admin client
  const supabase = getPublicSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, enabled, role")
    .eq("user_id", userId)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) return false;
  return (data as { role?: string }).role === "admin";
}

export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  return hasAdminTableRoleForClient(user.id);
}

export async function getCurrentAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return (await hasAdminTableRoleForClient(data.user.id)) ? data.user : null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getCurrentAdminUser()) !== null;
}
