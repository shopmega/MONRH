"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const AVIS_SITE_URL = process.env.NEXT_PUBLIC_AVIS_SITE_URL?.replace(/\/$/, "") || "https://avisine.com";

type CompanyContextResponse = {
  companyId: string | null;
  contextCard: {
    id: string;
    slug: string | null;
    name: string;
    city: string | null;
    category: string | null;
    overallRating: number | null;
    reviewCount: number;
    isClaimed: boolean;
    trustSummary: {
      overallScore: number;
      confidenceLevel: "low" | "medium" | "high";
      confidenceLabel: string;
      sourceMixLabel: string;
      whyThisResult: string;
      lastUpdatedAt: string | null;
    } | null;
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
    riskSummary: {
      level: "low" | "medium" | "high";
      reasons: string[];
    };
  } | null;
  error?: string;
};

export function CompanyContextCard({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const [data, setData] = useState<CompanyContextResponse["contextCard"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCompanyContext() {
      setLoading(true);

      try {
        const response = await fetch(`/api/reviewly/companies/${encodeURIComponent(companyId)}/context-card`);
        if (!response.ok) {
          throw new Error("company-context-unavailable");
        }

        const payload = (await response.json()) as CompanyContextResponse;
        if (!active) return;

        setData(payload.contextCard ?? null);
      } catch {
        if (!active) return;
        setData(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCompanyContext();

    return () => {
      active = false;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
          Contexte employeur
        </p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Chargement du profil entreprise...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const href = `${AVIS_SITE_URL}/companies/${data.slug || data.id}`;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Contexte employeur
          </p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
            {data.name || companyName}
          </h3>
        </div>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
        >
          Ouvrir sur AVISINE
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Trust index</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {data.trustSummary ? `${data.trustSummary.overallScore} / 100` : "Indisponible"}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Note</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {data.overallRating != null ? `${data.overallRating.toFixed(1)} / 5` : "Aucune note"}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Avis</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{data.reviewCount}</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Ville</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{data.city || "Non renseignee"}</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Statut</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {data.isClaimed ? "Profil revendique" : "Profil non revendique"}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Risque</p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {data.riskSummary.level === "high"
              ? "Eleve"
              : data.riskSummary.level === "medium"
                ? "Modere"
                : "Limite"}
          </p>
        </div>
      </div>

      {data.category || data.trustSummary || data.salarySummary || data.verificationSummary ? (
        <div className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
          {data.trustSummary ? (
            <>
              <p>
                <span className="font-semibold text-[var(--ink-soft)]">Confiance:</span> {data.trustSummary.confidenceLabel}
              </p>
              <p>
                <span className="font-semibold text-[var(--ink-soft)]">Sources:</span> {data.trustSummary.sourceMixLabel}
              </p>
              <p className="text-[var(--ink-soft)]">{data.trustSummary.whyThisResult}</p>
            </>
          ) : null}
          {data.category ? (
            <p>
              <span className="font-semibold text-[var(--ink-soft)]">Categorie:</span> {data.category}
            </p>
          ) : null}
          {data.salarySummary ? (
            <p className="break-all">
              <span className="font-semibold text-[var(--ink-soft)]">Bench salaire:</span>{" "}
              {data.salarySummary.submissionCount > 0
                ? `${data.salarySummary.medianMonthlySalary ?? "n/a"} MAD median | ${data.salarySummary.submissionCount} contributions`
                : "Aucun benchmark disponible"}
            </p>
          ) : null}
          {data.verificationSummary ? (
            <p className="text-[var(--ink-soft)]">
              Verifications: {data.verificationSummary.verified}/{data.verificationSummary.total} approuvees
              {data.verificationSummary.criticalQueueCount > 0
                ? ` | ${data.verificationSummary.criticalQueueCount} item(s) critiques`
                : ""}
            </p>
          ) : null}
          {data.riskSummary.reasons.length > 0 ? (
            <p className="line-clamp-3 text-[var(--ink-soft)]">{data.riskSummary.reasons[0]}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
