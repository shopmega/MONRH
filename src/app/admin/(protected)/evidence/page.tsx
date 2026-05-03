import Link from "next/link";
import { AdminEvidenceModerationForm } from "@/components/admin-evidence-moderation-form";
import { AdminModerationQueueItemControls } from "@/components/admin-moderation-queue-item-controls";
import { AdminEvidencePurgeButton } from "@/components/admin-evidence-purge-button";
import { listAdminAuditEvents } from "@/lib/server/admin-audit-store";
import { readAdminConfig } from "@/lib/server/admin-config";
import { getCurrentAdminUser } from "@/lib/server/admin-auth";
import { listCases } from "@/lib/server/app-store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

type EvidenceEntry = {
  id: string;
  label: string;
  evidenceType?: string;
  status?: string;
  createdAt?: string;
  archivedAt?: string;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  bucket?: string;
  note?: string;
};

type EvidenceCaseReview = {
  id: string;
  title: string;
  status: string;
  caseType: string;
  companyName: string | null;
  createdAt: string;
  moderationStatus: "open" | "resolved";
  moderationNote?: string;
  moderationResolutionReason?: string;
  moderationNeedsFollowUp: boolean;
  moderationAssigneeEmail?: string;
  moderationUpdatedAt?: string;
  moderationReviewerEmail?: string;
  active: EvidenceEntry[];
  archived: EvidenceEntry[];
  flags: string[];
};

type ModerationFilter = "open" | "resolved" | "follow-up" | "all";

type SharedQueueItem = {
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

function formatDate(value: string | undefined) {
  if (!value) return "Non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignee";
  return date.toLocaleString("fr-MA");
}

function formatBytes(value: number | undefined) {
  if (!value || Number.isNaN(value)) return "n/a";
  const mb = value / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} Mo`;
  return `${Math.round(value / 1024)} Ko`;
}

function extractEvidenceList(value: unknown): EvidenceEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: String(item.id ?? ""),
      label: String(item.label ?? "Preuve"),
      evidenceType: item.evidenceType ? String(item.evidenceType) : undefined,
      status: item.status ? String(item.status) : undefined,
      createdAt: item.createdAt ? String(item.createdAt) : undefined,
      archivedAt: item.archivedAt ? String(item.archivedAt) : undefined,
      fileName: item.fileName ? String(item.fileName) : undefined,
      fileSize: typeof item.fileSize === "number" ? item.fileSize : undefined,
      storagePath: item.storagePath ? String(item.storagePath) : undefined,
      bucket: item.bucket ? String(item.bucket) : undefined,
      note: item.note ? String(item.note) : undefined,
    }))
    .filter((item) => item.id.length > 0);
}

function extractModeration(
  value: unknown,
): Pick<
  EvidenceCaseReview,
  | "moderationStatus"
  | "moderationNote"
  | "moderationResolutionReason"
  | "moderationNeedsFollowUp"
  | "moderationAssigneeEmail"
  | "moderationUpdatedAt"
  | "moderationReviewerEmail"
> {
  if (!value || typeof value !== "object") {
    return { moderationStatus: "open", moderationNeedsFollowUp: false };
  }

  const record = value as Record<string, unknown>;
  return {
    moderationStatus: record.status === "resolved" ? "resolved" : "open",
    moderationNote: typeof record.note === "string" ? record.note : undefined,
    moderationResolutionReason: typeof record.resolutionReason === "string" ? record.resolutionReason : undefined,
    moderationNeedsFollowUp: record.needsFollowUp === true,
    moderationAssigneeEmail: typeof record.assigneeEmail === "string" ? record.assigneeEmail : undefined,
    moderationUpdatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    moderationReviewerEmail: typeof record.reviewerEmail === "string" ? record.reviewerEmail : undefined,
  };
}

function getFilterValue(value: string | string[] | undefined): ModerationFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "resolved") return "resolved";
  if (raw === "follow-up") return "follow-up";
  if (raw === "all") return "all";
  return "open";
}

function getSingleParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
}

function formatResolutionReason(value: string | undefined) {
  switch (value) {
    case "policy_ok":
      return "Conforme a la politique";
    case "retention_watch":
      return "Sous surveillance retention";
    case "missing_metadata":
      return "Metadonnees incompletes";
    case "user_request":
      return "Demande utilisateur";
    case "legal_sensitive":
      return "Sujet sensible / legal";
    case "other":
      return "Autre";
    default:
      return undefined;
  }
}

export default async function AdminEvidencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filter = getFilterValue(query.status);
  const caseId = getSingleParam(query.caseId);
  const [config, cases, auditEvents, currentAdminUser, sharedQueueRows] = await Promise.all([
    readAdminConfig(),
    listCases(),
    listAdminAuditEvents(),
    getCurrentAdminUser(),
    (getSupabaseAdminClient() as any)
      .from("moderation_queues")
      .select("id, entity_type, entity_id, status, priority, queue_reason, latest_action, company_id, assigned_admin_id, updated_at")
      .eq("source_app", "monrh")
      .in("entity_type", ["case_evidence", "employment_verification"])
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const now = Date.now();
  const retentionMs = config.evidenceGovernance.retentionDays * 86400000;

  const reviewedCases: EvidenceCaseReview[] = cases
    .map((item) => {
      const timeline = item.timeline as Record<string, unknown>;
      const active = extractEvidenceList(timeline.externalEvidence);
      const archived = extractEvidenceList(timeline.archivedExternalEvidence);
      const moderation = extractModeration(timeline.evidenceModeration);
      const flags = new Set<string>();

      active.forEach((entry) => {
        if (typeof entry.fileSize === "number" && entry.fileSize > config.evidenceGovernance.maxUploadBytes) {
          flags.add("preuve active au-dessus de la taille max actuelle");
        }
        if (entry.fileName && !entry.storagePath) {
          flags.add("fichier reference sans storagePath");
        }
      });

      archived.forEach((entry) => {
        if (entry.archivedAt) {
          const archivedAt = new Date(entry.archivedAt).getTime();
          if (!Number.isNaN(archivedAt) && now - archivedAt > retentionMs) {
            flags.add("preuve archivee au-dela de la retention cible");
          }
        }
      });

      return {
        id: item.id,
        title: item.title,
        status: item.status,
        caseType: item.caseType,
        companyName: item.companyName,
        createdAt: item.createdAt,
        moderationStatus: moderation.moderationStatus,
        moderationNote: moderation.moderationNote,
        moderationResolutionReason: moderation.moderationResolutionReason,
        moderationNeedsFollowUp: moderation.moderationNeedsFollowUp,
        moderationAssigneeEmail: moderation.moderationAssigneeEmail,
        moderationUpdatedAt: moderation.moderationUpdatedAt,
        moderationReviewerEmail: moderation.moderationReviewerEmail,
        active,
        archived,
        flags: [...flags],
      };
    })
    .filter((item) => item.active.length > 0 || item.archived.length > 0)
    .sort((a, b) => {
      if (a.moderationStatus !== b.moderationStatus) {
        return a.moderationStatus === "open" ? -1 : 1;
      }
      const scoreA = a.flags.length * 10 + a.active.length + a.archived.length;
      const scoreB = b.flags.length * 10 + b.active.length + b.archived.length;
      return scoreB - scoreA;
    });

  const evidenceAuditEvents = auditEvents.filter((event) => event.action.includes("evidence")).slice(0, 20);
  const sharedQueueItems: SharedQueueItem[] =
    sharedQueueRows.error || !sharedQueueRows.data
      ? []
      : (sharedQueueRows.data as Array<Record<string, unknown>>).map((row) => ({
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
  const scopedCases = caseId ? reviewedCases.filter((item) => item.id === caseId) : reviewedCases;
  const filteredCases = scopedCases.filter((item) => {
    if (filter === "all") return true;
    if (filter === "follow-up") return item.moderationNeedsFollowUp;
    return item.moderationStatus === filter;
  });
  const totalActive = scopedCases.reduce((sum, item) => sum + item.active.length, 0);
  const totalArchived = scopedCases.reduce((sum, item) => sum + item.archived.length, 0);
  const flaggedCases = scopedCases.filter((item) => item.flags.length > 0).length;
  const openCases = scopedCases.filter((item) => item.moderationStatus === "open").length;
  const resolvedCases = scopedCases.filter((item) => item.moderationStatus === "resolved").length;
  const followUpCases = scopedCases.filter((item) => item.moderationNeedsFollowUp).length;

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Evidence Review</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Dossiers et preuves</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Revue admin des preuves actives, archivees, flags de gouvernance et evenements de cycle de vie.
        </p>
        {caseId ? <p className="mt-3 text-xs text-[var(--ink-soft)]">Vue ciblee | dossier {caseId}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Dossiers avec preuves", value: reviewedCases.length.toString() },
          { label: "Preuves actives", value: totalActive.toString() },
          { label: "Preuves archivees", value: totalArchived.toString() },
          { label: "Dossiers ouverts / flagges", value: `${openCases} / ${flaggedCases}` },
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
          { value: "open", label: `Ouverts (${openCases})` },
          { value: "resolved", label: `Resolus (${resolvedCases})` },
          { value: "follow-up", label: `Suivi (${followUpCases})` },
          { value: "all", label: `Tous (${scopedCases.length})` },
        ].map((option) => {
          const active = filter === option.value;
          return (
            <Link
              key={option.value}
              href={`/admin/evidence?${new URLSearchParams({
                status: option.value,
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

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Shared queue SIMPAIE</h3>
          <div className="mt-3 space-y-2">
            {sharedQueueItems.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucun item partage pour evidence / verification.</p>
            ) : (
              sharedQueueItems.map((item) => (
                <div key={item.id} className="panel-strong rounded-xl p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                      {item.entityType}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--ink-soft)]">
                      {item.status}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--ink-soft)]">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">{item.queueReason ?? item.latestAction ?? "moderation_queue_item"}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {item.entityId}
                    {item.companyId ? ` | company ${item.companyId}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {item.assignedAdminId
                      ? `Assigne: ${item.assignedAdminId}`
                      : "Non assigne"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{formatDate(item.updatedAt)}</p>
                  <div className="mt-3">
                    <AdminModerationQueueItemControls
                      queueId={item.id}
                      status={item.status}
                      priority={item.priority}
                      isAssignedToCurrentAdmin={Boolean(
                        currentAdminUser && item.assignedAdminId === currentAdminUser.id,
                      )}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Politique active</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="panel-strong rounded-xl p-3 text-sm">
              <p className="font-semibold">TTL URL signee</p>
              <p className="mt-1 text-[var(--ink-soft)]">{config.evidenceGovernance.signedUrlTtlSeconds} secondes</p>
            </div>
            <div className="panel-strong rounded-xl p-3 text-sm">
              <p className="font-semibold">Retention</p>
              <p className="mt-1 text-[var(--ink-soft)]">{config.evidenceGovernance.retentionDays} jours</p>
            </div>
            <div className="panel-strong rounded-xl p-3 text-sm">
              <p className="font-semibold">Taille max</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {Math.round(config.evidenceGovernance.maxUploadBytes / (1024 * 1024))} Mo
              </p>
            </div>
            <div className="panel-strong rounded-xl p-3 text-sm">
              <p className="font-semibold">Archives telechargeables</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {config.evidenceGovernance.allowArchivedEvidenceDownload ? "Oui" : "Non"}
              </p>
            </div>
          </div>
        </article>

        <article className="soft-card rounded-3xl p-5">
          <h3 className="display-font text-2xl font-semibold">Derniers evenements preuves</h3>
          <div className="mt-3 space-y-2">
            {evidenceAuditEvents.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Aucun evenement evidence.</p>
            ) : (
              evidenceAuditEvents.map((event) => (
                <div key={event.id} className="panel-strong rounded-xl p-3 text-sm">
                  <p className="font-semibold">
                    {event.action}{" "}
                    <span className={event.status === "success" ? "text-[var(--accent)]" : "text-[var(--error-ink)]"}>
                      ({event.status})
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{formatDate(event.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="space-y-3">
        {filteredCases.length === 0 ? (
          <section className="soft-card rounded-3xl p-5 text-sm text-[var(--ink-soft)]">
            Aucun dossier ne correspond a ce filtre.
          </section>
        ) : (
          filteredCases.map((item) => (
            <article key={item.id} className="soft-card rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="section-kicker">Case</p>
                  <h3 className="display-font mt-1 text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {item.companyName || item.caseType} | {item.status} | Cree le {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.moderationStatus === "resolved"
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "bg-[var(--warning-soft)] text-[var(--foreground)]"
                    }`}
                  >
                    {item.moderationStatus === "resolved" ? "Revue resolue" : "Revue ouverte"}
                  </span>
                  {item.moderationNeedsFollowUp ? (
                    <span className="rounded-full bg-[var(--warning-soft)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                      Suivi requis
                    </span>
                  ) : null}
                  {item.moderationAssigneeEmail ? (
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                      {item.moderationAssigneeEmail}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                    {item.active.length} active{item.active.length > 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                    {item.archived.length} archivee{item.archived.length > 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/api/admin/evidence/export?caseId=${encodeURIComponent(item.id)}`}
                    className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
                  >
                    Export JSON
                  </Link>
                  <Link
                    href={`/admin/evidence?caseId=${encodeURIComponent(item.id)}`}
                    className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]"
                  >
                    Cibler ce dossier
                  </Link>
                </div>
              </div>

              <AdminEvidenceModerationForm
                caseId={item.id}
                initialStatus={item.moderationStatus}
                initialNote={item.moderationNote}
                initialResolutionReason={item.moderationResolutionReason}
                initialNeedsFollowUp={item.moderationNeedsFollowUp}
                initialAssigneeEmail={item.moderationAssigneeEmail}
                updatedAt={item.moderationUpdatedAt}
                reviewerEmail={item.moderationReviewerEmail}
              />

              {item.flags.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--warning-line)] bg-[var(--warning-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">Flags</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--foreground)]">
                    {item.flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.moderationNote ? (
                <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Note reviewer</p>
                  <p className="mt-2 text-[var(--foreground)]">{item.moderationNote}</p>
                  {item.moderationResolutionReason || item.moderationAssigneeEmail ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-soft)]">
                      {item.moderationResolutionReason ? (
                        <span>Raison: {formatResolutionReason(item.moderationResolutionReason) ?? item.moderationResolutionReason}</span>
                      ) : null}
                      {item.moderationAssigneeEmail ? <span>Assignee: {item.moderationAssigneeEmail}</span> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Preuves actives</p>
                  <div className="mt-2 space-y-2">
                    {item.active.length === 0 ? (
                      <div className="panel-strong rounded-xl p-3 text-sm text-[var(--ink-soft)]">Aucune preuve active.</div>
                    ) : (
                      item.active.map((entry) => (
                        <div key={entry.id} className="panel-strong rounded-xl p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">{entry.label}</p>
                            <span className="text-xs text-[var(--ink-soft)]">{entry.status ?? "available"}</span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ink-soft)]">
                            {entry.evidenceType ?? "other"} | {formatBytes(entry.fileSize)} | {formatDate(entry.createdAt)}
                          </p>
                          {entry.fileName ? <p className="mt-1 text-xs text-[var(--ink-soft)]">{entry.fileName}</p> : null}
                          {entry.note ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{entry.note}</p> : null}
                          {entry.storagePath ? (
                            <Link
                              href={`/api/admin/evidence/access?caseId=${encodeURIComponent(item.id)}&evidenceId=${encodeURIComponent(entry.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]"
                            >
                              Ouvrir le fichier
                            </Link>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Preuves archivees</p>
                  <div className="mt-2 space-y-2">
                    {item.archived.length === 0 ? (
                      <div className="panel-strong rounded-xl p-3 text-sm text-[var(--ink-soft)]">Aucune preuve archivee.</div>
                    ) : (
                      item.archived.map((entry) => (
                        <div key={entry.id} className="panel-strong rounded-xl p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">{entry.label}</p>
                            <span className="text-xs text-[var(--ink-soft)]">archivee</span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ink-soft)]">
                            {entry.evidenceType ?? "other"} | {formatBytes(entry.fileSize)} | Archivee le {formatDate(entry.archivedAt)}
                          </p>
                          {entry.fileName ? <p className="mt-1 text-xs text-[var(--ink-soft)]">{entry.fileName}</p> : null}
                          {entry.storagePath ? (
                            <Link
                              href={`/api/admin/evidence/access?caseId=${encodeURIComponent(item.id)}&evidenceId=${encodeURIComponent(entry.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]"
                            >
                              Ouvrir le fichier
                            </Link>
                          ) : null}
                          <div className="mt-2">
                            <AdminEvidencePurgeButton caseId={item.id} evidenceId={entry.id} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
