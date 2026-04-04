import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function decodeJwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: unknown;
    };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function validateServiceRoleKey(serviceRoleKey: string) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anonKey && anonKey === serviceRoleKey.trim()) {
    throw new Error(
      "Invalid SUPABASE_SERVICE_ROLE_KEY: it matches NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the real service role key from Supabase project settings.",
    );
  }

  const role = decodeJwtRole(serviceRoleKey.trim());
  if (role && role !== "service_role") {
    throw new Error(
      `Invalid SUPABASE_SERVICE_ROLE_KEY role "${role}". Expected "service_role".`,
    );
  }
}

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (cachedClient) {
    return cachedClient;
  }
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  validateServiceRoleKey(serviceRoleKey);
  cachedClient = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey,
    {
      db: { schema: "monrh" },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    } as any,
  );
  return cachedClient;
}
