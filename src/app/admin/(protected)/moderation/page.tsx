import Link from "next/link";
import { AdminModerationQueueItemControls } from "@/components/admin-moderation-queue-item-controls";
import { getCurrentAdminUser } from "@/lib/server/admin-auth";
import { listCases } from "@/lib/server/app-store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { listEmploymentVerificationsAdmin } from "@/lib/server/verification-store";

type StatusFilter = "open" | "in_review" | "resolved" | "dismissed" | "all";
type TypeFilter = "all" | "case_evidence" | "employment_verification";
type OwnerFilter = "all" | "mine" | "unassigned";

type QueueItem = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  priority: string;
  queueReason: string | null;
  latestAction: string | null;
  companyId: string | null;
  assignedAdminId: string | null;
  updatedAt: string;
};

type CaseContext = {
  id: string;
  title: string;
  companyName: string | null;
  status: string;
};

type VerificationContext = {
  id: string;
  companyName: string | null;
  sourceType: string;
  status: string;
  sourceCaseId: string | null;
};

function getStatusFilter(value: string | string[] | undefined): StatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "open" || raw === "in_review" || raw === "resolved" || raw === "dismissed") {
    return raw;
  }
  return "all";
}

function getTypeFilter(value: string | string[] | undefined): TypeFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "case_evidence" || raw === "employment_verification") {
    return raw;
  }
  return "all";
}

function getOwnerFilter(value: string | string[] | undefined): OwnerFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "mine" || raw === "unassigned") {
    return raw;
  }
  return "all";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignee";
  return date.toLocaleString("fr-MA");
}

function queueHref(item: QueueItem, verificationContextById: Map<string, VerificationContext>) {
  if (item.entityType === "case_evidence") {
    return `/admin/evidence?caseId=${encodeURIComponent(item.entityId)}`;
  }
  if (item.entityType === "employment_verification") {
    const verification = verificationContextById.get(item.entityId);
    const search = new URLSearchParams();
    search.set("verificationId", item.entityId);
    if (verification?.sourceCaseId) {
      search.set("caseId", verification.sourceCaseId);
    }
    return `/admin/verifications?${search.toString()}`;
  }
  return "/admin";
}

function typeLabel(value: string) {
  if (value === "case_evidence") return "Evidence";
  if (value === "employment_verification") return "Verification";
  return value;
}

function buildContextLabel(
  item: QueueItem,
  caseContextById: Map<string, CaseContext>,
  verificationContextById: Map<string, VerificationContext>,
) {
  if (item.entityType === "case_evidence") {
    const match = caseContextById.get(item.entityId);
    if (!match) return item.entityId;
    return `${match.title}${match.companyName ? ` | ${match.companyName}` : ""}`;
  }

  if (item.entityType === "employment_verification") {
    const match = verificationContextById.get(item.entityId);
    if (!match) return item.entityId;
    return `${match.companyName || item.companyId || item.entityId} | ${match.sourceType}`;
  }

  return item.entityId;
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const statusFilter = getStatusFilter(query.status);
  const typeFilter = getTypeFilter(query.type);
  const ownerFilter = getOwnerFilter(query.owner);
  const [currentAdminUser, queueResponse] = await Promise.all([
    getCurrentAdminUser(),
    (getSupabaseAdminClient() as any)
      .from("moderation_queues")
      .select(
        "id, entity_type, entity_id, status, priority, queue_reason, latest_action, company_id, assigned_admin_id, updated_at",
      )
      .eq("source_app", "monrh")
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  const queueItems: QueueItem[] =
    queueResponse.error || !queueResponse.data
      ? []
      : (queueResponse.data as Array<Record<string, unknown>>).map((row) => ({
          id: String(row.id),
          entityType: String(row.entity_type),
          entityId: String(row.entity_id),
          status: String(row.status),
          priority: String(row.priority),
          queueReason: row.queue_reason ? String(row.queue_reason) : null,
          latestAction: row.latest_action ? String(row.latest_action) : null,
          companyId: row.company_id ? String(row.company_id) : null,
          assignedAdminId: row.assigned_admin_id ? String(row.assigned_admin_id) : null,
          updatedAt: String(row.updated_at),
        }));

  const filteredItems = queueItems.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (typeFilter !== "all" && item.entityType !== typeFilter) return false;
    if (ownerFilter === "mine") {
      return Boolean(currentAdminUser && item.assignedAdminId === currentAdminUser.id);
    }
    if (ownerFilter === "unassigned") {
      return !item.assignedAdminId;
    }
    return true;
  });

  const caseIds = Array.from(
    new Set(queueItems.filter((item) => item.entityType === "case_evidence").map((item) => item.entityId)),
  );
  const verificationIds = Array.from(
    new Set(queueItems.filter((item) => item.entityType === "employment_verification").map((item) => item.entityId)),
  );

  const [cases, verifications] = await Promise.all([
    caseIds.length > 0 ? listCases() : Promise.resolve([]),
    verificationIds.length > 0 ? listEmploymentVerificationsAdmin({ limit: 300 }) : Promise.resolve([]),
  ]);

  const caseContextById = new Map<string, CaseContext>(
    cases
      .filter((item) => caseIds.includes(item.id))
      .map((item) => [
        item.id,
        {
          id: item.id,
          title: item.title,
          companyName: item.companyName,
          status: item.status,
        },
      ]),
  );

  const verificationContextById = new Map<string, VerificationContext>(
    verifications
      .filter((item) => verificationIds.includes(item.id))
      .map((item) => [
        item.id,
        {
          id: item.id,
          companyName: item.companyName,
          sourceType: item.sourceType,
          status: item.status,
          sourceCaseId: item.sourceCaseId,
        },
      ]),
  );

  const counts = {
    open: queueItems.filter((item) => item.status === "open").length,
    inReview: queueItems.filter((item) => item.status === "in_review").length,
    resolved: queueItems.filter((item) => item.status === "resolved").length,
    critical: queueItems.filter((item) => item.priority === "critical" && item.status !== "resolved").length,
  };

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Shared Moderation</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Queue SIMPAIE</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Vue consolidee des items evidence et verification dans la queue partagee.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ouverts", value: counts.open.toString() },
          { label: "En revue", value: counts.inReview.toString() },
          { label: "Resolus", value: counts.resolved.toString() },
          { label: "Critiques actifs", value: counts.critical.toString() },
        ].map((stat, index) => (
          <article
            key={stat.label}
            className={`rounded-2xl p-4 ${index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"}`}
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">{stat.label}</p>
            <p className="display-font mt-2 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        {[
          {
            href: "/admin/moderation",
            label: "Tous statuts",
            active: statusFilter === "all" && typeFilter === "all" && ownerFilter === "all",
          },
          { href: "/admin/moderation?status=open", label: "Ouverts", active: statusFilter === "open" },
          { href: "/admin/moderation?status=in_review", label: "En revue", active: statusFilter === "in_review" },
          { href: "/admin/moderation?status=resolved", label: "Resolus", active: statusFilter === "resolved" },
          { href: "/admin/moderation?owner=mine", label: "Mes items", active: ownerFilter === "mine" },
          {
            href: "/admin/moderation?owner=unassigned",
            label: "Non assignes",
            active: ownerFilter === "unassigned",
          },
          { href: "/admin/moderation?type=case_evidence", label: "Evidence", active: typeFilter === "case_evidence" },
          {
            href: "/admin/moderation?type=employment_verification",
            label: "Verifications",
            active: typeFilter === "employment_verification",
          },
        ].map((item) => {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                item.active
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        {filteredItems.length === 0 ? (
          <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">
            Aucun item ne correspond aux filtres.
          </section>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} className="soft-card rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                      {typeLabel(item.entityType)}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                      {item.status}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="display-font mt-3 text-2xl font-semibold">
                    {item.queueReason ?? item.latestAction ?? item.entityId}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {buildContextLabel(item, caseContextById, verificationContextById)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {item.entityId}
                    {item.companyId ? ` | company ${item.companyId}` : ""}
                  </p>
                  {item.entityType === "case_evidence" && caseContextById.get(item.entityId) ? (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Statut dossier: {caseContextById.get(item.entityId)?.status}
                    </p>
                  ) : null}
                  {item.entityType === "employment_verification" && verificationContextById.get(item.entityId) ? (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Verification: {verificationContextById.get(item.entityId)?.status}
                      {verificationContextById.get(item.entityId)?.sourceCaseId
                        ? ` | dossier ${verificationContextById.get(item.entityId)?.sourceCaseId}`
                        : ""}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {item.assignedAdminId ? `Assigne: ${item.assignedAdminId}` : "Non assigne"} | Mis a jour le{" "}
                    {formatDate(item.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={queueHref(item, verificationContextById)}
                    className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
                  >
                    Ouvrir la source
                  </Link>
                  {item.entityType === "employment_verification" &&
                  verificationContextById.get(item.entityId)?.sourceCaseId ? (
                    <Link
                      href={`/compte/dossiers/${encodeURIComponent(verificationContextById.get(item.entityId)!.sourceCaseId!)}`}
                      className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]"
                    >
                      Ouvrir dossier
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <AdminModerationQueueItemControls
                  queueId={item.id}
                  status={item.status}
                  priority={item.priority}
                  isAssignedToCurrentAdmin={Boolean(
                    currentAdminUser && item.assignedAdminId === currentAdminUser.id,
                  )}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
