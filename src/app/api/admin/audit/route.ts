import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listAdminAuditEvents } from "@/lib/server/admin-audit-store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [events, auditEventsResponse] = await Promise.all([
    listAdminAuditEvents(),
    (getSupabaseAdminClient() as any)
      .from("audit_events")
      .select("id, created_at, action, entity_type, entity_id, actor_user_id, event_payload")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const queueBackedEvents =
    auditEventsResponse.error || !auditEventsResponse.data
      ? []
      : (auditEventsResponse.data as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id),
          createdAt: String(item.created_at),
          action: String(item.action),
          status: "success" as const,
          meta: {
            entityType: item.entity_type,
            entityId: item.entity_id,
            actorUserId: item.actor_user_id,
            ...(typeof item.event_payload === "object" && item.event_payload ? (item.event_payload as Record<string, unknown>) : {}),
          },
        }));

  const merged = [...queueBackedEvents, ...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 300);

  return NextResponse.json({ ok: true, events: merged });
}
