import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, getSupabaseSchema } from "@/lib/supabase/config";

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createBrowserClient(
    getSupabaseUrl(), 
    getSupabaseAnonKey(), 
    { db: { schema: getSupabaseSchema() } }
  );
  return cachedClient;
}
