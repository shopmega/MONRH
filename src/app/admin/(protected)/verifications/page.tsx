import Link from "next/link";
import { AdminVerificationDecisionForm } from "@/components/admin-verification-decision-form";
import { AdminModerationQueueItemControls } from "@/components/admin-moderation-queue-item-controls";
import { getCurrentAdminUser } from "@/lib/server/admin-auth";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { listEmploymentVerificationsAdmin } from "@/lib/server/verification-store";

type VerificationFilter = "pending" | "verified" | "rejected" | "needs_more_info" | "all";
type SharedQueueRow = {
  id: string;
  entityId: string;
  status: string;
  priority: string;
  assignedAdminId: string | null;
};

function getSingleParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
}

function getFilterValue(value: string | string[] | undefined): VerificationFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "verified") return "verified";
  if (raw === "rejected") return "rejected";
  if (raw === "needs_more_info") return "needs_more_info";
  if (raw === "all") return "all";
  return "pending";
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filter = getFilterValue(query.status);
  const verificationId = getSingleParam(query.verificationId);
  const caseId = getSingleParam(query.caseId);
  const [items, allItems, currentAdminUser, sharedQueueResponse] = await Promise.all([
    listEmploymentVerificationsAdmin({
      status: filter === "all" ? undefined : filter,
      verificationId,
      caseId,
      limit: 200,
    }),
    filter === "all" && !verificationId && !caseId
      ? Promise.resolve(null)
      : listEmploymentVerificationsAdmin({ verificationId, caseId, limit: 200 }),
    getCurrentAdminUser(),
    (getSupabaseAdminClient() as any)
      .from("moderation_queues")
      .select("id, entity_id, status, priority, assigned_admin_id")
      .eq("source_app", "monrh")
      .eq("entity_type", "employment_verification")
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);
  const fullItemList = allItems ?? items;
  const sharedQueueByVerificationId = new Map<string, SharedQueueRow>(
    sharedQueueResponse.error || !sharedQueueResponse.data
      ? []
      : (sharedQueueResponse.data as Array<Record<string, unknown>>).map((row) => [
          String(row.entity_id),
          {
            id: String(row.id),
            entityId: String(row.entity_id),
            status: String(row.status),
            priority: String(row.priority),
            assignedAdminId: row.assigned_admin_id ? String(row.assigned_admin_id) : null,
          },
        ]),
  );

  const counts = {
    pending: fullItemList.filter((item) => item.status === "pending").length,
    verified: fullItemList.filter((item) => item.status === "verified").length,
    rejected: fullItemList.filter((item) => item.status === "rejected").length,
    needsMoreInfo: fullItemList.filter((item) => item.status === "needs_more_info").length,
  };

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Verification Review</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Verifications d'emploi</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Revue des candidats de verification generes depuis les documents et dossiers lies.
        </p>
        {verificationId || caseId ? (
          <p className="mt-3 text-xs text-[var(--ink-soft)]">
            Vue ciblee
            {verificationId ? ` | verification ${verificationId}` : ""}
            {caseId ? ` | dossier ${caseId}` : ""}
          </p>
        ) : null}
      </section>

      <section className="flex flex-wrap gap-2">
        {[
          { value: "pending", label: `En attente (${counts.pending})` },
          { value: "verified", label: `Verifiees (${counts.verified})` },
          { value: "rejected", label: `Rejetees (${counts.rejected})` },
          { value: "needs_more_info", label: `A completer (${counts.needsMoreInfo})` },
          { value: "all", label: `Toutes (${fullItemList.length})` },
        ].map((option) => {
          const active = filter === option.value;
          return (
            <Link
              key={option.value}
              href={`/admin/verifications?${new URLSearchParams({
                status: option.value,
                ...(verificationId ? { verificationId } : {}),
                ...(caseId ? { caseId } : {}),
              }).toString()}`}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                active
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        {items.length === 0 ? (
          <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">
            Aucune verification pour ce filtre.
          </section>
        ) : (
          items.map((item) => (
            <article key={item.id} className="soft-card rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="section-kicker">Verification</p>
                  <h3 className="display-font mt-1 text-2xl font-semibold">{item.companyName || item.companyId}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {item.sourceType} | Creee le {new Date(item.createdAt).toLocaleString("fr-MA")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                    {item.status}
                  </span>
                  {sharedQueueByVerificationId.get(item.id) ? (
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                      Queue {sharedQueueByVerificationId.get(item.id)?.status}
                    </span>
                  ) : null}
                  {sharedQueueByVerificationId.get(item.id)?.priority ? (
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                      Priorite {sharedQueueByVerificationId.get(item.id)?.priority}
                    </span>
                  ) : null}
                  {item.sourceCaseId ? (
                    <Link
                      href={`/compte/dossiers/${encodeURIComponent(item.sourceCaseId)}`}
                      className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
                    >
                      Ouvrir dossier
                    </Link>
                  ) : null}
                  <Link
                    href={`/admin/verifications?verificationId=${encodeURIComponent(item.id)}`}
                    className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]"
                  >
                    Cibler cette verification
                  </Link>
                </div>
              </div>

              {sharedQueueByVerificationId.get(item.id) ? (
                <div className="mt-3">
                  <AdminModerationQueueItemControls
                    queueId={sharedQueueByVerificationId.get(item.id)!.id}
                    status={sharedQueueByVerificationId.get(item.id)!.status}
                    priority={sharedQueueByVerificationId.get(item.id)!.priority}
                    isAssignedToCurrentAdmin={Boolean(
                      currentAdminUser &&
                        sharedQueueByVerificationId.get(item.id)!.assignedAdminId === currentAdminUser.id,
                    )}
                  />
                </div>
              ) : null}

              {item.latestDecision?.note ? (
                <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Derniere note</p>
                  <p className="mt-2 text-[var(--foreground)]">{item.latestDecision.note}</p>
                </div>
              ) : null}

              <AdminVerificationDecisionForm verificationId={item.id} />
            </article>
          ))
        )}
      </section>
    </div>
  );
}
