function requiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  const normalized = value.trim();
  if (
    normalized.includes("your-project-id.supabase.co") ||
    normalized === "your-anon-key" ||
    normalized === "your-service-role-key"
  ) {
    throw new Error(`Invalid placeholder environment variable: ${name}`);
  }
  return normalized;
}

export function getSupabaseUrl() {
  return requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseSchema() {
  return process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";
}
