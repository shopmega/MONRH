import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/server/admin-auth";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { insertAuditEvent } from "@/lib/server/moderation-queue";

type QueueAction = "take" | "release" | "set_priority" | "set_status";
type QueuePriority = "normal" | "critical";
type QueueStatus = "open" | "resolved" | "dismissed";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const adminUser = await getCurrentAdminUser();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const queueId = typeof payload.queueId === "string" ? payload.queueId.trim() : "";
  const action = payload.action;
  const priority = payload.priority;
  const nextStatus = payload.status;

  if (!queueId) {
    return NextResponse.json({ ok: false, error: "missing_queue_id" }, { status: 400 });
  }

  if (action !== "take" && action !== "release" && action !== "set_priority" && action !== "set_status") {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  if (
    action === "set_priority" &&
    priority !== "normal" &&
    priority !== "critical"
  ) {
    return NextResponse.json({ ok: false, error: "invalid_priority" }, { status: 400 });
  }

  if (
    action === "set_status" &&
    nextStatus !== "open" &&
    nextStatus !== "resolved" &&
    nextStatus !== "dismissed"
  ) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient() as any;
  const { data: queueItem, error: queueError } = await supabase
    .from("moderation_queues")
    .select("id, source_app, entity_type, entity_id, company_id, business_id, status, priority, assigned_admin_id")
    .eq("id", queueId)
    .eq("source_app", "monrh")
    .maybeSingle();

  if (queueError || !queueItem) {
    return NextResponse.json({ ok: false, error: "queue_item_not_found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  let auditAction = "";

  if (action === "take") {
    patch.assigned_admin_id = adminUser.id;
    patch.status = queueItem.status === "open" ? "in_review" : queueItem.status;
    auditAction = "admin_moderation_queue_take";
  } else if (action === "release") {
    patch.assigned_admin_id = null;
    patch.status = queueItem.status === "in_review" ? "open" : queueItem.status;
    auditAction = "admin_moderation_queue_release";
  } else if (action === "set_priority") {
    patch.priority = priority as QueuePriority;
    auditAction = "admin_moderation_queue_priority";
  } else {
    patch.status = nextStatus as QueueStatus;
    patch.latest_action = nextStatus === "open" ? "queue_reopened" : `queue_${nextStatus}`;

    if (nextStatus === "open") {
      patch.resolved_by_admin_id = null;
      patch.resolved_at = null;
    } else {
      patch.resolved_by_admin_id = adminUser.id;
      patch.resolved_at = new Date().toISOString();
      patch.assigned_admin_id = queueItem.assigned_admin_id ?? adminUser.id;
    }

    auditAction =
      nextStatus === "resolved"
        ? "admin_moderation_queue_resolve"
        : nextStatus === "dismissed"
          ? "admin_moderation_queue_dismiss"
          : "admin_moderation_queue_reopen";
  }

  if (action !== "set_status") {
    patch.latest_action =
      action === "take"
        ? "queue_taken"
        : action === "release"
          ? "queue_released"
          : `queue_priority_${priority}`;
  }

  const { error: updateError } = await supabase
    .from("moderation_queues")
    .update(patch)
    .eq("id", queueId)
    .eq("source_app", "monrh");

  if (updateError) {
    return NextResponse.json({ ok: false, error: "queue_item_update_failed" }, { status: 400 });
  }

  await insertAuditEvent({
    actorUserId: adminUser.id,
    actorType: "admin",
    action: auditAction,
    entityType: String(queueItem.entity_type),
    entityId: String(queueItem.entity_id),
    queueId,
    companyId: queueItem.company_id ? String(queueItem.company_id) : null,
    businessId: queueItem.business_id ? String(queueItem.business_id) : null,
    eventPayload:
      action === "set_priority"
        ? {
            previousPriority: queueItem.priority,
            nextPriority: priority,
            reviewerEmail: adminUser.email ?? null,
          }
        : action === "set_status"
          ? {
              previousStatus: queueItem.status,
              nextStatus,
              assignedAdminId: patch.assigned_admin_id ?? queueItem.assigned_admin_id ?? null,
              reviewerEmail: adminUser.email ?? null,
            }
        : {
            previousStatus: queueItem.status,
            nextStatus: patch.status ?? queueItem.status,
            assignedAdminId: patch.assigned_admin_id ?? null,
            reviewerEmail: adminUser.email ?? null,
          },
  });

  return NextResponse.json({ ok: true });
}
