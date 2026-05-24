import type { EmployerPlan } from "@/lib/employer/portal-data";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

type EmployerSubscriptionRow = {
  plan: EmployerPlan;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  current_period_end: string | null;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

const EMPLOYER_PLAN_LIMITS: Record<EmployerPlan, { maxCompanies: number }> = {
  free: { maxCompanies: 1 },
  pro: { maxCompanies: 1 },
  cabinet: { maxCompanies: 25 },
};

export function planAllowsFeature(plan: EmployerPlan, feature: "payslip_pdf" | "cnss_csv" | "multi_company") {
  if (feature === "multi_company") return plan === "cabinet";
  return plan === "pro" || plan === "cabinet";
}

export function getEmployerPlanLimit(plan: EmployerPlan, limit: "maxCompanies") {
  return EMPLOYER_PLAN_LIMITS[plan][limit];
}

export async function getEmployerSubscriptionPlan(userId: string): Promise<EmployerPlan> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("employer_subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`employer_subscription_lookup_failed: ${error.message}`);
  if (!data) return "free";

  const subscription = data as EmployerSubscriptionRow;
  const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
  const isExpired = subscription.current_period_end
    ? new Date(subscription.current_period_end).getTime() < Date.now()
    : false;
  return isActive && !isExpired ? subscription.plan : "free";
}

export async function requireEmployerPlanFeature(
  userId: string,
  feature: "payslip_pdf" | "cnss_csv" | "multi_company",
): Promise<EmployerPlan> {
  const plan = await getEmployerSubscriptionPlan(userId);
  if (!planAllowsFeature(plan, feature)) {
    const error = new Error(`employer_plan_feature_required:${feature}`);
    error.name = "EmployerPlanFeatureRequiredError";
    throw error;
  }
  return plan;
}

export function isEmployerPlanFeatureRequiredError(error: unknown): error is Error {
  return error instanceof Error && error.name === "EmployerPlanFeatureRequiredError";
}
