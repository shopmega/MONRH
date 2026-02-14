import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type EnvCheck = {
  name: string;
  present: boolean;
};

function checkEnv(): { ok: boolean; checks: EnvCheck[] } {
  const checks = REQUIRED_ENV.map((name) => ({
    name,
    present: Boolean(process.env[name] && process.env[name]?.trim().length),
  }));
  return {
    ok: checks.every((item) => item.present),
    checks,
  };
}

export async function GET() {
  const env = checkEnv();
  let supabaseOk = false;
  let supabaseError: string | null = null;

  if (env.ok) {
    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("law_versions").select("id").limit(1);
      if (error) {
        supabaseError = error.message;
      } else {
        supabaseOk = true;
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : "supabase_init_failed";
    }
  }

  const healthy = env.ok && supabaseOk;
  return NextResponse.json(
    {
      ok: healthy,
      timestamp: new Date().toISOString(),
      checks: {
        env: env.checks,
        supabase: {
          ok: supabaseOk,
          error: supabaseError,
        },
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
