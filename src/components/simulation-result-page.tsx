"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";
import { RelatedContent } from "@/components/related-content";
import { SimulationExplanation } from "@/components/simulation-explanation";
import {
  localizeBreakdownLabel,
  localizeCalculatorDescription,
  localizeCalculatorTitle,
} from "@/lib/i18n/simulator-localization";
import { calculatorTypeToPath } from "@/lib/simulations/calculator-path";
import { ReviewlyPromoCard } from "@/components/reviewly-promo-card";
import { type SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";
import type { PieSlice } from "@/components/charts/breakdown-pie-chart";
import type { BarEntry } from "@/components/charts/timeline-bar-chart";

const BreakdownPieChart = dynamic(
  () => import("@/components/charts/breakdown-pie-chart").then((m) => ({ default: m.BreakdownPieChart })),
  { ssr: false },
);

const TimelineBarChart = dynamic(
  () => import("@/components/charts/timeline-bar-chart").then((m) => ({ default: m.TimelineBarChart })),
  { ssr: false },
);

type DocumentCTA = { href: string; label: string };

const DOCUMENT_CTA_LABELS: Record<string, string> = {
  "labor-inspector-complaint": "Générer la plainte à l'inspection du travail",
  "salary-recovery-letter": "Générer la mise en demeure (salaires impayés)",
  "overtime-claim-letter": "Générer la mise en demeure (heures sup.)",
  "resignation-letter": "Générer la lettre de démission",
  "harassment-report-letter": "Signaler le harcèlement (lettre)",
  "maternity-leave-request": "Demander le congé maternité",
  "work-accident-declaration": "Déclarer l'accident du travail",
  "unpaid-leave-request": "Demander un congé sans solde",
  "contract-renewal-request": "Demander le renouvellement CDD",
  "notice-letter": "Générer la lettre de préavis",
};

function buildPrefilledDocumentLink(snapshot: SimulationResultSnapshot): DocumentCTA | null {
  const params = new URLSearchParams();
  const breakdown = snapshot.result.breakdown;
  const input = snapshot.inputPayload ?? {};
  const calculationDate = typeof input.calculationDate === "string" ? input.calculationDate : "";

  if (snapshot.calculatorType === "licenciement") {
    const total = typeof breakdown.totalEstimated === "number" ? breakdown.totalEstimated : undefined;
    const serviceYears =
      typeof breakdown.totalServiceYears === "number" ? breakdown.totalServiceYears : undefined;
    if (total !== undefined) {
      params.set("amount_due", String(total));
      params.set("request", `Regularisation des indemnites estimees a ${total} MAD.`);
    } else {
      params.set("request", "Regularisation des indemnites legales et des conges non regles.");
    }
    const isAbusive = Boolean(snapshot.result.breakdown.dommagesAbusif);
    if (isAbusive) {
      params.set("issue_summary", "Licenciement abusif et litige indemnites.");
    } else {
      params.set("issue_summary", serviceYears ? `Licenciement apres ${serviceYears} an(s) d'anciennete.` : "Litige de licenciement.");
    }
    const docId = "labor-inspector-complaint";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "unpaid_salary_recovery") {
    const total =
      typeof breakdown.totalClaimAmount === "number" ? breakdown.totalClaimAmount : undefined;
    const unpaidMonths = typeof input.unpaidMonths === "number" ? input.unpaidMonths : undefined;
    if (calculationDate) params.set("period", unpaidMonths ? `Derniers ${unpaidMonths} mois` : calculationDate);
    if (total !== undefined) params.set("amount_due", String(total));
    params.set("issue_summary", "Salaires impayes constates.");
    const docId = "salary-recovery-letter";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (
    snapshot.calculatorType === "unpaid_overtime_recovery" ||
    snapshot.calculatorType === "overtime" ||
    snapshot.calculatorType === "public_holiday_compensation"
  ) {
    const total =
      typeof breakdown.totalClaimAmount === "number"
        ? breakdown.totalClaimAmount
        : typeof breakdown.totalOvertimeAmount === "number"
          ? breakdown.totalOvertimeAmount
          : typeof breakdown.compensationAmount === "number"
            ? breakdown.compensationAmount
            : undefined;
    if (calculationDate) params.set("period", calculationDate);
    if (total !== undefined) params.set("amount_due", String(total));
    params.set("issue_summary", "Heures supplementaires non regularisees.");
    const docId = "overtime-claim-letter";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (
    snapshot.calculatorType === "duree_preavis" ||
    snapshot.calculatorType === "demission"
  ) {
    const contractType =
      typeof breakdown.contractType === "string" ? breakdown.contractType : "CDI";
    const workerCategory =
      typeof breakdown.workerCategory === "string" ? breakdown.workerCategory : "employe";
    const requiredNoticeMonths =
      typeof breakdown.requiredNoticeMonths === "number"
        ? breakdown.requiredNoticeMonths
        : undefined;
    const requiredNoticeDays =
      typeof breakdown.requiredNoticeDays === "number"
        ? breakdown.requiredNoticeDays
        : undefined;
    const leavePayout =
      typeof breakdown.leavePayout === "number" ? breakdown.leavePayout : undefined;
    const noticeComp =
      typeof breakdown.noticeCompensationDue === "number" ? breakdown.noticeCompensationDue : undefined;

    if (calculationDate) params.set("effective_date", calculationDate);
    if (leavePayout !== undefined) params.set("amount_due", String(leavePayout + (noticeComp ?? 0)));
    params.set("position", workerCategory);
    const docId = "resignation-letter";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "harassment_scenario") {
    if (calculationDate) params.set("period", calculationDate);
    params.set("issue_summary", "Signalement de faits de harcelement.");
    const docId = "harassment-report-letter";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "maternity_leave") {
    if (calculationDate) params.set("effective_date", calculationDate);
    params.set("request", "Conge maternite legal.");
    const docId = "maternity-leave-request";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "work_accident") {
    if (calculationDate) params.set("period", calculationDate);
    params.set("issue_summary", "Accident du travail survenu.");
    const docId = "work-accident-declaration";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "leave_accrual") {
    if (calculationDate) params.set("period", calculationDate);
    params.set("request", "Demande de conge exceptionnel.");
    const docId = "unpaid-leave-request";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "fin_cdd") {
    params.set("request", "Proposition de renouvellement de contrat.");
    const docId = "contract-renewal-request";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  if (snapshot.calculatorType === "probation_termination") {
    if (calculationDate) params.set("effective_date", calculationDate);
    const docId = "notice-letter";
    return { href: `/documents/${docId}?${params.toString()}`, label: DOCUMENT_CTA_LABELS[docId] };
  }

  return null;
}

function formatValue(
  value: string | number | boolean | undefined | null,
  locale: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  unit?: string,
) {
  if (value === undefined || value === null) return "-";
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }
  if (typeof value === "number") {
    return `${value.toLocaleString(locale)}${unit ? ` ${unit}` : ""}`;
  }
  return String(value);
}

function pickKeyMetrics(snapshot: SimulationResultSnapshot): Array<[string, number]> {
  const breakdown = snapshot?.result?.breakdown ?? {};
  const entries = Object.entries(breakdown).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );

  if (entries.length === 0) return [];

  const explicitPriority = [
    "totalEstimated",
    "totalClaimAmount",
    "totalOvertimeAmount",
    "net",
    "estimatedMonthlyPension",
    "cnssCompensation",
    "compensationAmount",
    "employerTotalCost",
  ];

  return [...entries]
    .sort((a, b) => {
      const idxA = explicitPriority.indexOf(a[0]);
      const idxB = explicitPriority.indexOf(b[0]);
      const scoreA = idxA >= 0 ? idxA : 999;
      const scoreB = idxB >= 0 ? idxB : 999;
      if (scoreA !== scoreB) return scoreA - scoreB;
      return Math.abs(b[1]) - Math.abs(a[1]);
    })
    .slice(0, 3);
}

/* ── Chart data helpers ──────────────────────────────────────────────── */

const PIE_CHART_TYPES = new Set(["net_gross", "employer_total_cost"]);
const BAR_CHART_TYPES = new Set(["leave_accrual", "seniority_growth"]);

const PIE_FIELD_CONFIG: Record<string, { label: string; color?: string }> = {
  net: { label: "Net", color: "var(--accent)" },
  cnssEmployee: { label: "CNSS salarié", color: "#60a5fa" },
  amoEmployee: { label: "AMO salarié", color: "#fb923c" },
  incomeTax: { label: "IR", color: "#a78bfa" },
  cimrEmployee: { label: "CIMR", color: "#34d399" },
  cnssEmployer: { label: "CNSS employeur", color: "#f472b6" },
  amoEmployer: { label: "AMO employeur", color: "#facc15" },
};

function buildPieData(breakdown: Record<string, string | number | boolean>): PieSlice[] {
  return Object.entries(PIE_FIELD_CONFIG)
    .map(([key, cfg]) => ({
      name: cfg.label,
      value: typeof breakdown[key] === "number" && (breakdown[key] as number) > 0
        ? (breakdown[key] as number)
        : 0,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0);
}

const BAR_FIELD_PRIORITY = [
  "accruedDaysPerYear", "accruedDaysTotal", "totalLeaveDays",
  "seniorityBonus", "annualBonus", "totalAnnualLeave",
];

function buildBarData(
  breakdown: Record<string, string | number | boolean> | undefined,
  labels: Record<string, string> | undefined,
): BarEntry[] {
  const entries = Object.entries(breakdown ?? {})
    .filter((e): e is [string, number] => typeof e[1] === "number" && (e[1] as number) >= 0)
    .sort((a, b) => {
      const ia = BAR_FIELD_PRIORITY.indexOf(a[0]);
      const ib = BAR_FIELD_PRIORITY.indexOf(b[0]);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    })
    .slice(0, 8);
  return entries.map(([key, value]) => ({
    label: (labels ?? {})[key] ?? key,
    value,
  }));
}

export function SimulationResultPage({ slug, expectedPath: providedExpectedPath }: { slug: string; expectedPath?: string }) {
  const { language, t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const expectedPath = providedExpectedPath ?? `/simulateurs/${slug}`;
  const simulationId = searchParams.get("simulationId");
  const [mappedRelatedItems, setMappedRelatedItems] = useState<
    Array<{ title: string; description: string; href: string }>
  >([]);
  const [copyStatus, setCopyStatus] = useState<string>();
  const [historySnapshot, setHistorySnapshot] = useState<SimulationResultSnapshot | null | undefined>(
    simulationId ? undefined : null,
  );
  const snapshotRaw = useSyncExternalStore(
    () => () => { },
    () => {
      if (typeof window === "undefined") return null;
      return (
        window.sessionStorage.getItem("salarie_last_simulation_result") ??
        window.localStorage.getItem("salarie_last_simulation_result")
      );
    },
    () => null,
  );
  const snapshot = useMemo<SimulationResultSnapshot | null>(() => {
    if (!snapshotRaw) return null;
    try {
      const parsed = JSON.parse(snapshotRaw) as SimulationResultSnapshot;
      if (!parsed || parsed.calculatorPath !== expectedPath) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [expectedPath, snapshotRaw]);
  const resolvedSnapshot = historySnapshot ?? snapshot;
  const prefilledDocumentCTA = resolvedSnapshot ? buildPrefilledDocumentLink(resolvedSnapshot) : null;
  const keyMetrics = useMemo(() => (resolvedSnapshot ? pickKeyMetrics(resolvedSnapshot) : []), [resolvedSnapshot]);

  const showPieChart = resolvedSnapshot ? PIE_CHART_TYPES.has(resolvedSnapshot.calculatorType) : false;
  const showBarChart = resolvedSnapshot ? BAR_CHART_TYPES.has(resolvedSnapshot.calculatorType) : false;

  const pieData = useMemo<PieSlice[]>(
    () => (resolvedSnapshot && showPieChart ? buildPieData(resolvedSnapshot.result?.breakdown ?? {}) : []),
    [resolvedSnapshot, showPieChart],
  );
  const barData = useMemo<BarEntry[]>(
    () =>
      resolvedSnapshot && showBarChart
        ? buildBarData(resolvedSnapshot.result?.breakdown, resolvedSnapshot.breakdownLabels)
        : [],
    [resolvedSnapshot, showBarChart],
  );

  useEffect(() => {
    if (!simulationId || snapshot) return;

    let active = true;
    fetch(`/api/simulations/${encodeURIComponent(simulationId)}`, { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }: {
        response: Response; data: {
          ok?: boolean; item?: {
            id: string;
            createdAt: string;
            calculatorType: string;
            input: Record<string, unknown>;
            result: Record<string, unknown>;
          }
        }
      }) => {
        if (!active || !response.ok || !data.ok || !data.item) {
          if (active) setHistorySnapshot(null);
          return;
        }

        const path = calculatorTypeToPath(data.item.calculatorType) ?? expectedPath;
        if (path !== expectedPath) {
          setHistorySnapshot(null);
          return;
        }

        const breakdown = ((data.item.result as { breakdown?: Record<string, string | number | boolean> }).breakdown ??
          {}) as Record<string, string | number | boolean>;
        const labels = Object.fromEntries(Object.keys(breakdown).map((key) => [key, key]));
        const resultPayload = data.item.result as {
          versionCode?: string;
          breakdown?: Record<string, string | number | boolean>;
          explanation?: {
            summary: string;
            assumptions: string[];
            formulas: string[];
            warnings: string[];
            nextSteps: string[];
          };
        };

        setHistorySnapshot({
          calculatorPath: expectedPath,
          calculatorType: data.item.calculatorType,
          title: data.item.calculatorType,
          description: data.item.calculatorType,
          generatedAt: data.item.createdAt,
          breakdownLabels: labels,
          units: {},
          locale,
          inputPayload: data.item.input,
          result: {
            versionCode: resultPayload.versionCode ?? "ma_2026",
            breakdown,
            explanation: resultPayload.explanation,
          },
        });
      })
      .catch(() => {
        if (active) setHistorySnapshot(null);
      });

    return () => {
      active = false;
    };
  }, [expectedPath, locale, simulationId, snapshot]);

  useEffect(() => {
    const currentSnapshot = resolvedSnapshot;
    if (!currentSnapshot) return;
    const calculatorType = currentSnapshot.calculatorType;
    let active = true;
    async function loadMappedRelated() {
      const response = await fetch(
        `/api/public-linking?sourceType=simulator&sourceId=${encodeURIComponent(calculatorType)}`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        items?: Array<{ title: string; description: string; href: string }>;
      };
      if (!active || !data.ok || !data.items) return;
      setMappedRelatedItems(data.items);
    }
    loadMappedRelated().catch(() => { });
    return () => {
      active = false;
    };
  }, [resolvedSnapshot]);

  if (simulationId && !snapshot && historySnapshot === undefined) {
    return (
      <main className="paper-bg min-h-screen">
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
          <section className="soft-card rounded-3xl p-5">
            <p className="text-sm text-[var(--ink-soft)]">{t("common.loading")}</p>
          </section>
        </div>
      </main>
    );
  }

  if (!resolvedSnapshot) {
    return (
      <main className="paper-bg min-h-screen">
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
          <section className="soft-card rounded-3xl p-5">
            <h1 className="display-font text-2xl font-semibold">{t("resultPage.unavailableTitle")}</h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{t("resultPage.unavailableDescription")}</p>
            <Link href={expectedPath} className="btn-primary mt-4 inline-flex px-4 py-2 text-sm">
              {t("resultPage.backToSimulator")}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const safeSnapshot = resolvedSnapshot;

  async function copySummary() {
    const lines = Object.entries(safeSnapshot.result.breakdown).map(([key, value]) => {
      const label = localizeBreakdownLabel(key, safeSnapshot.breakdownLabels[key] ?? key, language);
      return `${label}: ${formatValue(value, safeSnapshot.locale, t, safeSnapshot.units[key])}`;
    });
    const payload = [
      localizeCalculatorTitle(safeSnapshot.calculatorType, safeSnapshot.title, language),
      `${t("common.legalVersion")}: ${safeSnapshot.result.versionCode}`,
      ...lines,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      setCopyStatus(t("resultPage.copySuccess"));
    } catch {
      setCopyStatus(t("resultPage.copyError"));
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-5 sm:p-7">
          <p className="section-kicker">{t("resultPage.kicker")}</p>
          <h1 className="display-font mt-2 break-words text-3xl font-semibold sm:text-4xl">
            {localizeCalculatorTitle(resolvedSnapshot.calculatorType, resolvedSnapshot.title, language)}
          </h1>
          <p className="mt-2 break-words text-sm text-[var(--ink-soft)]">
            {localizeCalculatorDescription(resolvedSnapshot.calculatorType, resolvedSnapshot.description, language)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">
              {t("common.legalVersion")}: {resolvedSnapshot.result.versionCode}
            </span>
            {resolvedSnapshot.generatedAt ? (
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">
                {t("resultPage.generatedAt")}:{" "}
                {new Date(resolvedSnapshot.generatedAt).toLocaleString(resolvedSnapshot.locale)}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">
              1. {t("simulator.stepInput")}
            </span>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">
              2. {t("simulator.stepCompute")}
            </span>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
              3. {t("simulator.stepResult")}
            </span>
          </div>
          <Link href={expectedPath} className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
            {t("resultPage.backToForm")}
          </Link>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)] lg:items-start">
          <section className="space-y-4">
            {keyMetrics.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {keyMetrics.map(([key, value]) => (
                  <article key={key} className="kpi-card rounded-2xl p-4">
                    <p className="break-words text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                      {localizeBreakdownLabel(key, resolvedSnapshot.breakdownLabels[key] ?? key, language)}
                    </p>
                    <p className="mt-1 break-words text-xl font-semibold text-[var(--foreground)]">
                      {formatValue(value, resolvedSnapshot.locale, t, resolvedSnapshot.units[key])}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}

            {showPieChart && pieData.length > 0 ? (
              <section className="soft-card min-w-0 rounded-3xl p-5">
                <p className="section-kicker">Répartition salariale</p>
                <div className="mt-3">
                  <BreakdownPieChart data={pieData} />
                </div>
              </section>
            ) : null}

            {showBarChart && barData.length > 0 ? (
              <section className="soft-card min-w-0 rounded-3xl p-5">
                <p className="section-kicker">Projection</p>
                <div className="mt-3">
                  <TimelineBarChart data={barData} />
                </div>
              </section>
            ) : null}

            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{t("resultPage.breakdownTitle")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.entries(resolvedSnapshot.result?.breakdown ?? {}).map(([key, value]) => (
                  <div key={key} className="panel-strong min-w-0 rounded-xl p-3">
                    <p className="break-words text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                      {localizeBreakdownLabel(key, (resolvedSnapshot.breakdownLabels ?? {})[key] ?? key, language)}
                    </p>
                    <p className="mt-1 break-words font-semibold">
                      {formatValue(value, resolvedSnapshot.locale, t, (resolvedSnapshot.units ?? {})[key])}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{t("resultPage.actionsTitle")}</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link href={expectedPath} className="btn-muted px-4 py-2 text-center">
                  {t("resultPage.editParams")}
                </Link>
                <button type="button" onClick={copySummary} className="btn-muted px-4 py-2 text-center">
                  {t("resultPage.copySummary")}
                </button>
                <button type="button" onClick={() => window.print()} className="btn-muted px-4 py-2 text-center">
                  {t("resultPage.print")}
                </button>
                <Link href="/simulateurs" className="btn-primary px-4 py-2 text-center">
                  {t("resultPage.runAnother")}
                </Link>
                {prefilledDocumentCTA ? (
                  <Link
                    href={prefilledDocumentCTA.href}
                    className="btn-primary px-4 py-2 text-center font-semibold"
                  >
                    {prefilledDocumentCTA.label}
                  </Link>
                ) : null}
              </div>
              {copyStatus ? (
                <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{copyStatus}</p>
              ) : null}
            </section>

            <section className="soft-card rounded-3xl p-5">
              <p className="section-kicker">{t("common.partner")}</p>
              <div className="mt-3">
                <ReviewlyPromoCard
                  type={
                    resolvedSnapshot.calculatorType === "licenciement" ||
                      resolvedSnapshot.calculatorType === "unpaid_salary_recovery"
                      ? "conflict"
                      : "general"
                  }
                />
              </div>
            </section>

            <section className="soft-card rounded-3xl p-5">
              <p className="section-kicker">{t("common.partner")}</p>
              <div className="mt-3">
                <AdSlot slot="4545454545" format="auto" />
              </div>
            </section>
          </aside>
        </div>

        <SimulationExplanation explanation={resolvedSnapshot.result.explanation} />
        <RelatedContent
          items={
            (mappedRelatedItems ?? []).length > 0
              ? mappedRelatedItems
              : [
                {
                  title: t("simulator.relatedSimulatorsTitle"),
                  description: t("simulator.relatedSimulatorsDesc"),
                  href: "/simulateurs",
                },
                {
                  title: t("simulator.relatedDocumentsTitle"),
                  description: t("simulator.relatedDocumentsDesc"),
                  href: "/documents",
                },
                {
                  title: t("simulator.relatedLibraryTitle"),
                  description: t("simulator.relatedLibraryDesc"),
                  href: "/bibliotheque",
                },
              ]
          }
        />
      </div>
    </main>
  );
}
