"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildEvidenceChecklist, getCaseStepKey } from "@/lib/cases/timeline";
import type { SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";
import { buildPreLitigationTimeline } from "@/lib/tools/pre-litigation-timeline";
import { buildToolResultDocumentLinks } from "@/lib/tools/result-document-links";

type WorkflowScenario =
  | "salary_delay"
  | "unpaid_salary"
  | "unpaid_overtime"
  | "abusive_dismissal"
  | "harassment";

function mapScenario(calculatorType: string): WorkflowScenario | null {
  if (calculatorType === "licenciement") return "abusive_dismissal";
  if (calculatorType === "unpaid_salary_recovery") return "unpaid_salary";
  if (
    calculatorType === "unpaid_overtime_recovery" ||
    calculatorType === "overtime" ||
    calculatorType === "public_holiday_compensation"
  ) {
    return "unpaid_overtime";
  }
  if (calculatorType === "harassment_scenario") return "harassment";
  return null;
}

function pickIncidentDate(snapshot: SimulationResultSnapshot): string {
  const rawDate = snapshot.inputPayload?.calculationDate;
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  if (snapshot.generatedAt) {
    return new Date(snapshot.generatedAt).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function pickBoolean(inputPayload: Record<string, unknown> | undefined, keys: string[]): boolean {
  if (!inputPayload) return false;

  for (const key of keys) {
    if (typeof inputPayload[key] === "boolean") {
      return Boolean(inputPayload[key]);
    }
  }

  return false;
}

function appendCaseIdToHref(href: string, caseId?: string) {
  if (!caseId) return href;

  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("caseId", caseId);
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

type EmployerContextPayload = {
  companyId: string | null;
  contextCard: {
    trustSummary: {
      overallScore: number;
      confidenceLevel: "low" | "medium" | "high";
      confidenceLabel: string;
      sourceMixLabel: string;
      whyThisResult: string;
      lastUpdatedAt: string | null;
    } | null;
    riskSummary: {
      level: "low" | "medium" | "high";
      reasons: string[];
    };
    verificationSummary: {
      total: number;
      verified: number;
      rejected: number;
      needsMoreInfo: number;
      criticalQueueCount: number;
      evidenceArtifactCount: number;
      evidenceAvailableCount: number;
    } | null;
    salarySummary: {
      submissionCount: number;
      medianMonthlySalary: number | null;
      pctAboveCityAvg: number | null;
      pctAboveSectorAvg: number | null;
      mostReportedJobTitle: string | null;
    } | null;
  } | null;
};

function buildTrustActionNote(
  trustSummary: NonNullable<NonNullable<EmployerContextPayload["contextCard"]>["trustSummary"]>,
  riskSummary?: NonNullable<NonNullable<EmployerContextPayload["contextCard"]>["riskSummary"]> | null,
) {
  if (riskSummary?.level === "high" && riskSummary.reasons.length > 0) {
    return riskSummary.reasons[0];
  }

  if (trustSummary.overallScore < 40 || trustSummary.confidenceLevel === "low") {
    return "Employeur a confiance faible: conservez toutes les preuves, privilegiez les echanges ecrits et preparez vite une escalade.";
  }

  if (trustSummary.overallScore < 65 || trustSummary.confidenceLevel === "medium") {
    return "Employeur a risque modere: documentez chaque etape et ne vous contentez pas d engagements verbaux.";
  }

  return "Le contexte employeur est relativement solide, mais gardez une trace ecrite complete avant toute demarche.";
}

export function SimulationCaseWorkflow({
  snapshot,
  locale,
  sourceSimulationId,
  company,
}: {
  snapshot: SimulationResultSnapshot;
  locale: string;
  sourceSimulationId?: string;
  company?: { id: string; name: string } | null;
}) {
  const scenario = mapScenario(snapshot.calculatorType);
  if (!scenario) {
    return null;
  }
  const resolvedScenario = scenario;

  const [saveStatus, setSaveStatus] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<string>();
  const [trustSummary, setTrustSummary] = useState<NonNullable<NonNullable<EmployerContextPayload["contextCard"]>["trustSummary"]> | null>(null);
  const [employerRisk, setEmployerRisk] = useState<NonNullable<NonNullable<EmployerContextPayload["contextCard"]>["riskSummary"]> | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<NonNullable<NonNullable<EmployerContextPayload["contextCard"]>["verificationSummary"]> | null>(null);
  const [salarySummary, setSalarySummary] = useState<NonNullable<NonNullable<EmployerContextPayload["contextCard"]>["salarySummary"]> | null>(null);
  const internalResolutionAttempted = pickBoolean(snapshot.inputPayload, [
    "internalResolutionAttempted",
    "internal_resolution_attempted",
  ]);
  const evidenceReady = pickBoolean(snapshot.inputPayload, [
    "evidenceReady",
    "evidence_ready",
    "hasMedicalProof",
    "hasWrittenProof",
    "hasPayslips",
  ]);

  const result = buildPreLitigationTimeline({
    incidentDate: pickIncidentDate(snapshot),
    scenario: resolvedScenario,
    internalResolutionAttempted,
    evidenceReady,
    urgentFinancialPressure: pickBoolean(snapshot.inputPayload, [
      "urgentFinancialPressure",
      "urgent_financial_pressure",
    ]),
  });

  const relatedDocs = buildToolResultDocumentLinks({
    toolId: "pre_litigation_timeline",
    result,
  });
  const trustActionNote = useMemo(
    () => (trustSummary ? buildTrustActionNote(trustSummary, employerRisk) : null),
    [trustSummary, employerRisk],
  );

  useEffect(() => {
    if (!company?.id) {
      setTrustSummary(null);
      setEmployerRisk(null);
      setVerificationSummary(null);
      setSalarySummary(null);
      return;
    }

    const companyId = company.id;
    let active = true;

    async function loadTrust() {
      try {
        const response = await fetch(`/api/reviewly/companies/${encodeURIComponent(companyId)}/context-card`);
        if (!response.ok) {
          throw new Error("trust-unavailable");
        }

        const payload = (await response.json()) as EmployerContextPayload;
        if (!active) return;
        setTrustSummary(payload.contextCard?.trustSummary ?? null);
        setEmployerRisk(payload.contextCard?.riskSummary ?? null);
        setVerificationSummary(payload.contextCard?.verificationSummary ?? null);
        setSalarySummary(payload.contextCard?.salarySummary ?? null);
      } catch {
        if (!active) return;
        setTrustSummary(null);
        setEmployerRisk(null);
        setVerificationSummary(null);
        setSalarySummary(null);
      }
    }

    void loadTrust();

    return () => {
      active = false;
    };
  }, [company?.id]);

  async function saveCase() {
    if (saving || savedCaseId) {
      return;
    }

    setSaving(true);
    setSaveStatus(undefined);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: resolvedScenario,
          title: `Dossier ${snapshot.title}`,
          status: "open",
          companyId: company?.id || null,
          companyName: company?.name || null,
          sourceSimulationId: sourceSimulationId ?? null,
          timeline: {
            ...result,
            employerTrust: trustSummary && company
              ? {
                  companyId: company.id,
                  companyName: company.name,
                  overallScore: trustSummary.overallScore,
                  confidenceLevel: trustSummary.confidenceLevel,
                  confidenceLabel: trustSummary.confidenceLabel,
                  sourceMixLabel: trustSummary.sourceMixLabel,
                  whyThisResult: trustSummary.whyThisResult,
                  lastUpdatedAt: trustSummary.lastUpdatedAt,
                  riskLevel: employerRisk?.level,
                  riskReasons: employerRisk?.reasons ?? [],
                  verificationTotal: verificationSummary?.total,
                  criticalQueueCount: verificationSummary?.criticalQueueCount,
                  salarySubmissionCount: salarySummary?.submissionCount,
                  medianMonthlySalary: salarySummary?.medianMonthlySalary ?? null,
                }
              : undefined,
            evidenceChecklist: buildEvidenceChecklist(resolvedScenario, {
              evidenceReady,
              internalResolutionAttempted,
            }),
            stepStates: Object.fromEntries(
              result.steps.map((step, index) => [getCaseStepKey(step, index), { done: false }]),
            ),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("case-save-failed");
      }

      const data = (await response.json()) as { ok?: boolean; item?: { id?: string } };
      if (data.item?.id) {
        setSavedCaseId(data.item.id);
      }
      setSaveStatus("Ajoute a Mon dossier.");
    } catch {
      setSaveStatus("Enregistrement impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="soft-card rounded-3xl p-5">
      <p className="section-kicker">Mode dossier</p>
      <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          Risque dossier: {result.riskScore}/100
        </p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Niveau: {result.level}. Cette feuille de route est derivee de votre simulation actuelle.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {result.steps.slice(0, 3).map((step, index) => (
          <article key={`${step.code}-${index}`} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {index + 1}. {step.title}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{step.description}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
              Echeance: {new Date(step.dueDate).toLocaleDateString(locale)}
            </p>
            {step.documentHref ? (
              <Link
                href={appendCaseIdToHref(step.documentHref, savedCaseId)}
                className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]"
              >
                Ouvrir le document
              </Link>
            ) : null}
          </article>
        ))}
      </div>

      {trustSummary ? (
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Ajustement selon l employeur
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
            Trust index: {trustSummary.overallScore}/100 | {trustSummary.confidenceLabel}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{trustActionNote}</p>
          {employerRisk ? (
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Risque: {employerRisk.level} {employerRisk.reasons[1] ? `| ${employerRisk.reasons[1]}` : ""}
            </p>
          ) : null}
          {salarySummary ? (
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Bench salaire: {salarySummary.submissionCount} contribution(s)
              {salarySummary.medianMonthlySalary != null ? ` | mediane ${salarySummary.medianMonthlySalary} MAD` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {relatedDocs.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Documents recommandes
          </p>
          <div className="mt-3 space-y-2">
            {relatedDocs.slice(0, 2).map((doc) => (
              <div key={doc.href} className="rounded-xl bg-[var(--surface-muted)] p-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{doc.title}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{doc.description}</p>
                <Link
                  href={appendCaseIdToHref(doc.href, savedCaseId)}
                  className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]"
                >
                  Preparer
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Link href="/outils/feuille-route-pre-contentieux" className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
        Ouvrir la feuille de route complete
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveCase}
          disabled={saving || Boolean(savedCaseId)}
          className="btn-muted px-4 py-2 text-sm"
        >
          {saving ? "Enregistrement..." : savedCaseId ? "Deja ajoute a Mon dossier" : "Ajouter a Mon dossier"}
        </button>
        {savedCaseId ? (
          <Link href={`/compte/dossiers/${encodeURIComponent(savedCaseId)}`} className="text-sm font-semibold text-[var(--accent)]">
            Ouvrir le dossier
          </Link>
        ) : null}
      </div>
      <div>
        {saveStatus ? <p className="mt-2 text-sm text-[var(--ink-soft)]">{saveStatus}</p> : null}
      </div>
    </section>
  );
}
