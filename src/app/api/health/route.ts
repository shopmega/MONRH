import { NextRequest, NextResponse } from "next/server";
import { readLinkMap } from "@/lib/linking/link-map";
import { listArticles } from "@/lib/server/articles-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listDocuments, listSimulations } from "@/lib/server/app-store";
import { listDocumentTemplatesWithOptions } from "@/lib/server/document-templates-store";
import { readLawRulesBundle } from "@/lib/server/law-rules-store";
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

type CheckResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error: string | null;
};

async function timedCheck(name: string, run: () => Promise<void>): Promise<CheckResult> {
  const started = Date.now();
  try {
    await run();
    return { name, ok: true, durationMs: Date.now() - started, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "unknown_error";
    const fullError = error instanceof Error ? `${errorMessage}${error.stack ? `\n${error.stack}` : ''}` : errorMessage;
    return {
      name,
      ok: false,
      durationMs: Date.now() - started,
      error: errorMessage,
    };
  }
}

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

export async function GET(request: NextRequest) {
  const env = checkEnv();
  const scope = request.nextUrl.searchParams.get("scope");
  const deep = scope === "all";

  const baseChecks: CheckResult[] = [];
  let supabaseReady = false;

  if (env.ok) {
    const supabasePing = await timedCheck("supabase.ping", async () => {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("law_versions").select("id").limit(1);
      if (error) throw new Error(error.message);
    });
    baseChecks.push(supabasePing);
    supabaseReady = supabasePing.ok;
  } else {
    baseChecks.push({
      name: "supabase.ping",
      ok: false,
      durationMs: 0,
      error: "missing_required_env",
    });
  }

  if (!deep) {
    const healthy = env.ok && baseChecks.every((item) => item.ok);
    return NextResponse.json(
      {
        ok: healthy,
        scope: "basic",
        timestamp: new Date().toISOString(),
        checks: {
          env: env.checks,
          base: baseChecks,
        },
      },
      { status: healthy ? 200 : 503 },
    );
  }

  const admin = await isAdminAuthenticated();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const deepChecks: CheckResult[] = [];
  if (supabaseReady) {
    const supabase = getSupabaseAdminClient();
    
    // Check tables sequentially with correct column names
    const tableChecks = [
      { name: "articles", column: "slug" },
      { name: "document_templates", column: "id" },
      { name: "app_settings", column: "key" }, // Note: uses 'key' not 'name'
      { name: "admin_users", column: "user_id" },
      { name: "user_simulations", column: "id" },
      { name: "user_documents", column: "id" },
      { name: "user_cases", column: "id" },
      { name: "evidence_artifacts", column: "id" },
      { name: "employment_verifications", column: "id" },
      { name: "user_violation_logs", column: "id" },
      { name: "user_overtime_logs", column: "id" }
    ];
    
    for (const tableCheck of tableChecks) {
      const check = await timedCheck(`db.${tableCheck.name}`, async () => {
        const { error } = await supabase.from(tableCheck.name).select(tableCheck.column).limit(1);
        if (error) throw new Error(`${error.code || 'UNKNOWN'}: ${error.message}`);
      });
      deepChecks.push(check);
    }
  }

  const apiChecksBase = await Promise.all([
    timedCheck("api.admin.config", async () => {
      try {
        await readAdminConfig();
      } catch (error) {
        throw new Error(`Failed to read admin config: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
    timedCheck("api.admin.rules", async () => {
      try {
        await readLawRulesBundle();
      } catch (error) {
        throw new Error(`Failed to read law rules: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
    timedCheck("api.admin.linking", async () => {
      try {
        await readLinkMap();
      } catch (error) {
        throw new Error(`Failed to read link map: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
    timedCheck("api.articles", async () => {
      try {
        await listArticles();
      } catch (error) {
        throw new Error(`Failed to list articles: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
    timedCheck("api.documents.templates", async () => {
      try {
        await listDocumentTemplatesWithOptions({ includeInactive: true });
      } catch (error) {
        throw new Error(`Failed to list document templates: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
    timedCheck("api.simulations", async () => {
      try {
        await listSimulations();
      } catch (error) {
        throw new Error(`Failed to list simulations: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
    timedCheck("api.documents.generated", async () => {
      try {
        await listDocuments();
      } catch (error) {
        throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }),
  ]);

  const avisUrl = process.env.AVIS_API_URL?.replace(/\/$/, "");
  const reviewlyCheck =
    avisUrl ?
      await timedCheck("api.reviewly.health", async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${avisUrl}/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as { status?: string };
        if (data.status !== "healthy") throw new Error("unhealthy");
      }) : null;

  if (reviewlyCheck) {
    deepChecks.push(reviewlyCheck);
  }

  const healthy = env.ok && baseChecks.every((item) => item.ok) && deepChecks.every((item) => item.ok);

  // Collect summary of failures for easier debugging
  const failures = [
    ...baseChecks.filter(item => !item.ok),
    ...deepChecks.filter(item => !item.ok),
  ];

  return NextResponse.json(
    {
      ok: healthy,
      scope: "all",
      timestamp: new Date().toISOString(),
      summary: {
        total: baseChecks.length + deepChecks.length,
        passed: baseChecks.filter(item => item.ok).length + deepChecks.filter(item => item.ok).length,
        failed: failures.length,
      },
      failures: failures.map(f => ({
        name: f.name,
        error: f.error,
        durationMs: f.durationMs,
      })),
      checks: {
        env: env.checks,
        base: baseChecks,
        deep: deepChecks,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
