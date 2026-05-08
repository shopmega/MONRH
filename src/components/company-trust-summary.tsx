"use client";

import { useEffect, useState } from "react";

type CompanyRiskResponse = {
  companyId: string | null;
  riskSummary: {
    level: "low" | "medium" | "high";
    reasons: string[];
    trustScore: number | null;
    confidenceLevel: "low" | "medium" | "high" | null;
    verificationTotal: number;
    salarySubmissionCount: number;
    criticalQueueCount: number;
  } | null;
};

type CompanyTrustResponse = {
  companyId: string | null;
  trust: {
    overallScore: number;
    confidenceLabel: string;
    confidenceLevel: "low" | "medium" | "high";
    breakdown: Array<{
      id: "reviews" | "salaries" | "offers" | "verification" | "recency" | "moderation";
      label: string;
      score: number;
    }>;
    lastUpdatedAt: string | null;
    sourceMixLabel: string;
    whyThisResult: string;
  } | null;
  sources: Array<{
    id: "reviews" | "salaries" | "verification";
    label: string;
    count: number;
  }>;
  assumptions: string[];
  missingInformation: string[];
  signalsSummary: {
    salaryCount: number;
    verificationCount: number;
    evidenceArtifactCount: number;
    moderationQueueCriticalCount: number;
    verificationQueueCriticalCount: number;
  } | null;
};

type CompanyTrustPanelState = {
  risk: CompanyRiskResponse["riskSummary"] | null;
  trust: CompanyTrustResponse["trust"] | null;
  sources: CompanyTrustResponse["sources"];
  assumptions: string[];
  missingInformation: string[];
  signalsSummary: CompanyTrustResponse["signalsSummary"] | null;
};

function toneClasses(level: "low" | "medium" | "high") {
  if (level === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (level === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function confidenceTone(level: "low" | "medium" | "high" | null) {
  if (level === "high") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (level === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (level === "low") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }
  return "border-[var(--line)] bg-[var(--surface-elevated)] text-[var(--ink-soft)]";
}

export function CompanyTrustSummary({
  companyId,
}: {
  companyId: string;
}) {
  const [payload, setPayload] = useState<CompanyTrustPanelState | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const encodedId = encodeURIComponent(companyId);
        const [trustResponse, riskResponse] = await Promise.all([
          fetch(`/api/reviewly/companies/${encodedId}/trust`),
          fetch(`/api/reviewly/companies/${encodedId}/risk-summary`),
        ]);

        if (!trustResponse.ok && !riskResponse.ok) {
          throw new Error("company-trust-unavailable");
        }

        const trustData = trustResponse.ok ? ((await trustResponse.json()) as CompanyTrustResponse) : null;
        const riskData = riskResponse.ok ? ((await riskResponse.json()) as CompanyRiskResponse) : null;

        if (!active) return;

        setPayload({
          trust: trustData?.trust ?? null,
          risk: riskData?.riskSummary ?? null,
          sources: trustData?.sources ?? [],
          assumptions: trustData?.assumptions ?? [],
          missingInformation: trustData?.missingInformation ?? [],
          signalsSummary: trustData?.signalsSummary ?? null,
        });
      } catch {
        if (!active) return;
        setPayload(null);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [companyId]);

  const risk = payload?.risk ?? null;
  const trust = payload?.trust ?? null;
  const signalsSummary = payload?.signalsSummary ?? null;

  if (!risk && !trust) {
    return null;
  }

  const confidenceLevel = trust?.confidenceLevel ?? risk?.confidenceLevel ?? null;
  const displayScore = trust?.overallScore ?? risk?.trustScore ?? null;
  const primaryReason = trust?.whyThisResult ?? risk?.reasons[0] ?? "Aucun signal risque detaille pour le moment.";
  const visibleSources = (payload?.sources ?? []).filter((source) => source.count > 0);
  const criticalQueueCount = risk?.criticalQueueCount
    ?? (signalsSummary?.moderationQueueCriticalCount ?? 0) + (signalsSummary?.verificationQueueCriticalCount ?? 0);

  return (
    <section className="soft-card rounded-3xl p-5">
      <p className="section-kicker">Verdict employeur</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Trust index</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {displayScore != null ? `${displayScore}/100` : "n/a"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Risque</p>
          <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses(risk?.level ?? "low")}`}>
            {risk?.level === "high" ? "Risque eleve" : risk?.level === "medium" ? "Risque modere" : "Risque limite"}
          </span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Confiance</p>
          <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${confidenceTone(confidenceLevel)}`}>
            {trust?.confidenceLabel ?? (confidenceLevel ? `Confiance ${confidenceLevel}` : "Confiance indisponible")}
          </span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Queues critiques</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{criticalQueueCount}</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Lecture rapide</p>
        <p className="mt-2 text-sm text-[var(--foreground)]">{primaryReason}</p>

        {trust?.breakdown?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {trust.breakdown.slice(0, 4).map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--ink-soft)]"
              >
                {item.label}: {item.score}/100
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          Verifications: {risk?.verificationTotal ?? signalsSummary?.verificationCount ?? 0}
          {" | "}Benchmarks salaire: {risk?.salarySubmissionCount ?? signalsSummary?.salaryCount ?? 0}
          {typeof signalsSummary?.evidenceArtifactCount === "number" ? ` | Preuves: ${signalsSummary.evidenceArtifactCount}` : ""}
        </p>

        {visibleSources.length ? (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Sources: {visibleSources.map((source) => `${source.label} (${source.count})`).join(" | ")}
          </p>
        ) : trust?.sourceMixLabel ? (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Sources: {trust.sourceMixLabel}</p>
        ) : null}

        {payload?.assumptions?.length ? (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Hypotheses: {payload.assumptions.slice(0, 2).join(" | ")}
          </p>
        ) : null}

        {payload?.missingInformation?.length ? (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Informations manquantes: {payload.missingInformation.slice(0, 2).join(" | ")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
