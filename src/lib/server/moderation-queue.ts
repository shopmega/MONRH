import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

type ModerationQueueInput = {
  entityType: string;
  entityId: string;
  companyId?: string | null;
  businessId?: string | null;
  userId?: string | null;
  status?: "open" | "in_review" | "resolved" | "dismissed";
  priority?: "low" | "normal" | "high" | "critical";
  queueReason?: string | null;
  latestAction?: string | null;
  assignedAdminId?: string | null;
  createdByAdminId?: string | null;
  resolvedByAdminId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function upsertModerationQueueItem(input: ModerationQueueInput) {
  const supabase = getSupabaseAdminClient() as any;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("moderation_queues")
    .upsert(
      {
        source_app: "monrh",
        entity_type: input.entityType,
        entity_id: input.entityId,
        company_id: input.companyId ?? null,
        business_id: input.businessId ?? null,
        user_id: input.userId ?? null,
        status: input.status ?? "open",
        priority: input.priority ?? "normal",
        queue_reason: input.queueReason ?? null,
        latest_action: input.latestAction ?? null,
        assigned_admin_id: input.assignedAdminId ?? null,
        created_by_admin_id: input.createdByAdminId ?? null,
        resolved_by_admin_id: input.resolvedByAdminId ?? null,
        metadata: input.metadata ?? {},
        resolved_at:
          input.status === "resolved" || input.status === "dismissed" ? now : null,
      },
      { onConflict: "source_app,entity_type,entity_id" },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("monrh moderation queue upsert failed", error);
    return null;
  }

  return data?.id ? String(data.id) : null;
}

export async function insertAuditEvent(input: {
  actorUserId?: string | null;
  actorType?: "admin" | "system" | "user";
  action: string;
  entityType: string;
  entityId?: string | null;
  queueId?: string | null;
  companyId?: string | null;
  businessId?: string | null;
  eventPayload?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient() as any;

  const { error } = await supabase.from("audit_events").insert({
    source_app: "monrh",
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType ?? "admin",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    queue_id: input.queueId ?? null,
    company_id: input.companyId ?? null,
    business_id: input.businessId ?? null,
    event_payload: input.eventPayload ?? {},
  });

  if (error) {
    console.error("monrh audit_events insert failed", error);
  }
}
