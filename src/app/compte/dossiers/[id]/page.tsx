import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseWorkflowPanel } from "@/components/case-workflow-panel";
import { CompanyContextCard } from "@/components/company-context-card";
import { CompanyTrustSummary } from "@/components/company-trust-summary";
import type { CaseTimelinePayload, TimelineDocument } from "@/lib/cases/timeline";
import { calculatorTypeToPath } from "@/lib/simulations/calculator-path";
import { getCaseById, getSimulationById } from "@/lib/server/app-store";
import { getCurrentUserId } from "@/lib/server/user-session";
import { listEvidenceArtifacts, listEmploymentVerifications } from "@/lib/server/verification-store";

function formatDate(value: string | undefined, locale: string) {
  if (!value) return "Non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignee";
  return date.toLocaleDateString(locale);
}

function deadlineSeverityLabel(value: "low" | "medium" | "high" | "critical" | undefined) {
  if (value === "critical") return "Retard critique";
  if (value === "high") return "Echeance proche";
  if (value === "medium") return "A suivre";
  return "Sous controle";
}

function escalationReadinessLabel(value: "low" | "medium" | "high" | undefined) {
  if (value === "high") return "Pret a escalader";
  if (value === "medium") return "Preparation en cours";
  return "Dossier fragile";
}

export default async function CompteDossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) {
    notFound();
  }

  const { id } = await params;
  const item = await getCaseById(id, userId);
  if (!item) {
    notFound();
  }

  const simulation = item.sourceSimulationId ? await getSimulationById(item.sourceSimulationId, userId) : null;
  const [verifications, evidenceArtifacts] = await Promise.all([
    listEmploymentVerifications(userId, { caseId: id, limit: 20 }),
    listEvidenceArtifacts(userId, { caseId: id, limit: 20 }),
  ]);
  const simulationPath = simulation ? calculatorTypeToPath(simulation.calculatorType) : null;
  const simulationHref =
    simulation && simulationPath
      ? `${simulationPath}/result?simulationId=${encodeURIComponent(simulation.id)}`
      : null;

  const locale = "fr-MA";
  const timeline = item.timeline as CaseTimelinePayload;
  const linkedDocuments = Array.isArray(timeline.documents)
    ? (timeline.documents as TimelineDocument[])
    : [];
  const workflowSummary = timeline.workflowSummary;

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Mon dossier</p>
              <h1 className="display-font mt-2 text-3xl font-semibold sm:text-4xl">{item.title}</h1>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {item.companyName || item.caseType} | Cree le {formatDate(item.createdAt, locale)} | Mis a jour le{" "}
                {formatDate(item.updatedAt, locale)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {item.status}
              </span>
              <Link href="/compte" className="btn-muted px-4 py-2 text-xs uppercase tracking-[0.12em]">
                Retour compte
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <CaseWorkflowPanel
              caseId={item.id}
              caseType={item.caseType}
              initialTimeline={timeline}
              locale={locale}
            />
          </div>

          <aside className="space-y-4">
            <section className="soft-card rounded-3xl p-5">
              <p className="section-kicker">Resume</p>
              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Type</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{item.caseType}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Statut</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{item.status}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Documents</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{linkedDocuments.length}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Verifications</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{verifications.length}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Preuves structurees</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{evidenceArtifacts.length}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Urgence</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {deadlineSeverityLabel(workflowSummary?.deadlineSeverity)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Escalade</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {escalationReadinessLabel(workflowSummary?.escalationReadiness)}
                  </p>
                  {typeof workflowSummary?.escalationScore === "number" ? (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">{workflowSummary.escalationScore}/100</p>
                  ) : null}
                </div>
              </div>

              {simulationHref ? (
                <Link href={simulationHref} className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
                  Revenir a la simulation source
                </Link>
              ) : null}
            </section>

            {timeline.employerTrust ? (
              <section className="soft-card rounded-3xl p-5">
                <p className="section-kicker">Signal employeur memorise</p>
                <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {timeline.employerTrust.companyName} | {timeline.employerTrust.overallScore}/100
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {timeline.employerTrust.confidenceLabel} | {timeline.employerTrust.sourceMixLabel}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{timeline.employerTrust.whyThisResult}</p>
                  {timeline.employerTrust.riskLevel ? (
                    <p className="mt-2 text-xs text-[var(--ink-soft)]">
                      Risque memorise: {timeline.employerTrust.riskLevel}
                      {timeline.employerTrust.riskReasons?.[0]
                        ? ` | ${timeline.employerTrust.riskReasons[0]}`
                        : ""}
                    </p>
                  ) : null}
                  {(typeof timeline.employerTrust.verificationTotal === "number" ||
                    typeof timeline.employerTrust.salarySubmissionCount === "number" ||
                    typeof timeline.employerTrust.criticalQueueCount === "number") ? (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Verifications: {timeline.employerTrust.verificationTotal ?? 0}
                      {" | "}
                      Benchmarks salaire: {timeline.employerTrust.salarySubmissionCount ?? 0}
                      {" | "}
                      Queues critiques: {timeline.employerTrust.criticalQueueCount ?? 0}
                    </p>
                  ) : null}
                  {typeof timeline.employerTrust.medianMonthlySalary === "number" ? (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Mediane salaire memorisee: {timeline.employerTrust.medianMonthlySalary} MAD
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="soft-card rounded-3xl p-5">
              <p className="section-kicker">Verification</p>
              <div className="mt-3 space-y-2">
                {verifications.length === 0 ? (
                  <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                    Aucune verification liee a ce dossier.
                  </div>
                ) : (
                  verifications.map((entry) => (
                    <div key={entry.id} className="panel-strong rounded-2xl p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{entry.companyName || "Entreprise liee"}</p>
                        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {entry.sourceType} | Cree le {formatDate(entry.createdAt, locale)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="soft-card rounded-3xl p-5">
              <p className="section-kicker">Preuves structurees</p>
              <div className="mt-3 space-y-2">
                {evidenceArtifacts.length === 0 ? (
                  <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                    Aucune preuve structuree liee a ce dossier.
                  </div>
                ) : (
                  evidenceArtifacts.map((artifact) => (
                    <div key={artifact.id} className="panel-strong rounded-2xl p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{artifact.title}</p>
                        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                          {artifact.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {artifact.companyName || item.companyName || "Dossier"} | Cree le {formatDate(artifact.createdAt, locale)}
                      </p>
                      {artifact.description ? (
                        <p className="mt-2 text-xs text-[var(--ink-soft)]">{artifact.description}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            {item.companyId && item.companyName ? (
              <>
                <CompanyTrustSummary companyId={item.companyId} />
                <CompanyContextCard companyId={item.companyId} companyName={item.companyName} />
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
