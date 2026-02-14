import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function hasAdminTableRoleForClient(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string): Promise<boolean> {
  const { data, error } = (await supabase
    .from("admin_users")
    .select("user_id, enabled, role")
    .eq("user_id", userId)
    .eq("enabled", true)
    .maybeSingle()) as { data: { role?: string } | null; error: { message: string } | null };

  if (error || !data) return false;
  return data.role === "admin";
}

export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  return hasAdminTableRoleForClient(supabase, user.id);
}

export async function getCurrentAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return (await hasAdminTableRoleForClient(supabase, data.user.id)) ? data.user : null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getCurrentAdminUser()) !== null;
}
