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
    return {
      name,
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown_error",
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
    deepChecks.push(
      ...(await Promise.all([
        timedCheck("db.articles", async () => {
          const { error } = await supabase.from("articles").select("slug").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.document_templates", async () => {
          const { error } = await supabase.from("document_templates").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.app_settings", async () => {
          const { error } = await supabase.from("app_settings").select("name").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.admin_users", async () => {
          const { error } = await supabase.from("admin_users").select("user_id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.user_simulations", async () => {
          const { error } = await supabase.from("user_simulations").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.user_documents", async () => {
          const { error } = await supabase.from("user_documents").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.user_cases", async () => {
          const { error } = await supabase.from("user_cases").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.evidence_artifacts", async () => {
          const { error } = await supabase.from("evidence_artifacts").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.employment_verifications", async () => {
          const { error } = await supabase.from("employment_verifications").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.user_violation_logs", async () => {
          const { error } = await supabase.from("user_violation_logs").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
        timedCheck("db.user_overtime_logs", async () => {
          const { error } = await supabase.from("user_overtime_logs").select("id").limit(1);
          if (error) throw new Error(error.message);
        }),
      ])),
    );
  }

  const apiChecksBase = await Promise.all([
    timedCheck("api.admin.config", async () => {
      await readAdminConfig();
    }),
    timedCheck("api.admin.rules", async () => {
      await readLawRulesBundle();
    }),
    timedCheck("api.admin.linking", async () => {
      await readLinkMap();
    }),
    timedCheck("api.articles", async () => {
      await listArticles();
    }),
    timedCheck("api.documents.templates", async () => {
      await listDocumentTemplatesWithOptions({ includeInactive: true });
    }),
    timedCheck("api.simulations", async () => {
      await listSimulations();
    }),
    timedCheck("api.documents.generated", async () => {
      await listDocuments();
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
      })
    : { name: "api.reviewly.health", ok: true, durationMs: 0, error: null as string | null };

  const apiChecks = [...apiChecksBase, reviewlyCheck];
  const allChecks = [...baseChecks, ...deepChecks, ...apiChecks];
  const requiredChecks = allChecks.filter((c) => c.name !== "api.reviewly.health");
  const healthy = env.ok && requiredChecks.every((item) => item.ok);

  return NextResponse.json(
    {
      ok: healthy,
      scope: "all",
      timestamp: new Date().toISOString(),
      checks: {
        env: env.checks,
        base: baseChecks,
        database: deepChecks,
        apis: apiChecks,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
