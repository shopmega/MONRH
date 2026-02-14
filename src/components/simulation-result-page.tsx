"use client";

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
import { type SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";

function buildPrefilledDocumentLink(snapshot: SimulationResultSnapshot): string | null {
  const params = new URLSearchParams();
  const breakdown = snapshot.result.breakdown;
  const input = snapshot.inputPayload ?? {};

  const calculationDate = typeof input.calculationDate === "string" ? input.calculationDate : "";
  if (calculationDate) {
    params.set("effective_date", calculationDate);
    params.set("period", calculationDate);
  }

  if (snapshot.calculatorType === "licenciement") {
    const total = typeof breakdown.totalEstimated === "number" ? breakdown.totalEstimated : undefined;
    const serviceYears =
      typeof breakdown.totalServiceYears === "number" ? breakdown.totalServiceYears : undefined;
    params.set(
      "issue_summary",
      serviceYears ? `Licenciement apres ${serviceYears} an(s) d'anciennete.` : "Litige de licenciement.",
    );
    if (total !== undefined) {
      params.set("amount_due", String(total));
      params.set("request", `Regularisation des indemnites estimees a ${total} MAD.`);
    } else {
      params.set("request", "Regularisation des indemnites legales et des conges non regles.");
    }
    return `/documents/labor-inspector-complaint?${params.toString()}`;
  }

  if (snapshot.calculatorType === "unpaid_salary_recovery") {
    const total =
      typeof breakdown.totalClaimAmount === "number" ? breakdown.totalClaimAmount : undefined;
    if (total !== undefined) params.set("amount_due", String(total));
    params.set("issue_summary", "Salaires impayes constates.");
    return `/documents/salary-recovery-letter?${params.toString()}`;
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
    if (total !== undefined) params.set("amount_due", String(total));
    params.set("issue_summary", "Heures supplementaires non regularisees.");
    return `/documents/overtime-claim-letter?${params.toString()}`;
  }

  return null;
}

function formatValue(
  value: string | number | boolean,
  locale: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  unit?: string,
) {
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }
  if (typeof value === "number") {
    return `${value.toLocaleString(locale)}${unit ? ` ${unit}` : ""}`;
  }
  return value;
}

function pickKeyMetrics(snapshot: SimulationResultSnapshot): Array<[string, number]> {
  const entries = Object.entries(snapshot.result.breakdown).filter(
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

export function SimulationResultPage({ slug }: { slug: string }) {
  const { language, t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const expectedPath = `/simulateurs/${slug}`;
  const simulationId = searchParams.get("simulationId");
  const [mappedRelatedItems, setMappedRelatedItems] = useState<
    Array<{ title: string; description: string; href: string }>
  >([]);
  const [copyStatus, setCopyStatus] = useState<string>();
  const [historySnapshot, setHistorySnapshot] = useState<SimulationResultSnapshot | null | undefined>(
    simulationId ? undefined : null,
  );
  const snapshotRaw = useSyncExternalStore(
    () => () => {},
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
  const prefilledDocumentLink = resolvedSnapshot ? buildPrefilledDocumentLink(resolvedSnapshot) : null;
  const keyMetrics = useMemo(() => (resolvedSnapshot ? pickKeyMetrics(resolvedSnapshot) : []), [resolvedSnapshot]);

  useEffect(() => {
    if (!simulationId || snapshot) return;

    let active = true;
    fetch(`/api/simulations/${encodeURIComponent(simulationId)}`, { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }: { response: Response; data: { ok?: boolean; item?: {
        id: string;
        createdAt: string;
        calculatorType: string;
        input: Record<string, unknown>;
        result: Record<string, unknown>;
      } } }) => {
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
    loadMappedRelated().catch(() => {});
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

            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{t("resultPage.breakdownTitle")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.entries(resolvedSnapshot.result.breakdown).map(([key, value]) => (
                  <div key={key} className="panel-strong min-w-0 rounded-xl p-3">
                    <p className="break-words text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                      {localizeBreakdownLabel(key, resolvedSnapshot.breakdownLabels[key] ?? key, language)}
                    </p>
                    <p className="mt-1 break-words font-semibold">
                      {formatValue(value, resolvedSnapshot.locale, t, resolvedSnapshot.units[key])}
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
                {prefilledDocumentLink ? (
                  <Link href={prefilledDocumentLink} className="btn-primary px-4 py-2 text-center">
                    {t("resultPage.generateLetter")}
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
                <AdSlot slot="4545454545" format="auto" />
              </div>
            </section>
          </aside>
        </div>

        <SimulationExplanation explanation={resolvedSnapshot.result.explanation} />
        <RelatedContent
          items={
            mappedRelatedItems.length > 0
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
