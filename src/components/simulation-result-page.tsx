"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PartnerAdSection } from "@/components/partner-ad-section";
import { CompanyContextCard } from "@/components/company-context-card";
import { CompanyTrustSummary } from "@/components/company-trust-summary";
import { useLanguage } from "@/components/language-provider";
import { RelatedContent } from "@/components/related-content";
import { SimulationCaseWorkflow } from "@/components/simulation-case-workflow";
import { SimulationExplanation } from "@/components/simulation-explanation";
import { SITE_URL } from "@/lib/seo";
import {
  localizeBreakdownLabel,
  localizeCalculatorDescription,
  localizeCalculatorTitle,
} from "@/lib/i18n/simulator-localization";
import { calculatorTypeToPath, pathToCalculatorType, savedSimulationPathMatches } from "@/lib/simulations/calculator-path";
import { AvisinePromoCard } from "@/components/avisine-promo-card";
import { type SimulationResultSnapshot } from "@/lib/simulations/result-snapshot";
import { buildSimulationResultDocumentLink } from "@/lib/tools/result-document-links";
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
type EmployerCompanyContext = { id: string; name: string };
type StoredSimulationItem = {
  id: string;
  createdAt: string;
  calculatorType: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
};

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
  const link = buildSimulationResultDocumentLink(snapshot);
  if (!link) {
    return null;
  }

  return {
    href: link.href,
    label: link.ctaLabel ?? link.title,
  };
}

function formatValue(
  value: string | number | boolean | undefined | null,
  locale: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  unit?: string,
) {
  if (value === undefined || value === null) return "-";
  if (typeof value === "object") return ""; // Hide complex objects/arrays from table
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }
  if (typeof value === "number") {
    return `${value.toLocaleString(locale)}${unit ? ` ${unit}` : ""}`;
  }
  return String(value);
}

function flattenObject(obj: any, prefix = ""): Record<string, string | number | boolean> {
  if (!obj || typeof obj !== "object") return {};
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + "." : "";
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {} as Record<string, string | number | boolean>);
}

function getEffectiveBreakdown(result: any): Record<string, string | number | boolean> {
  if (!result) return {};
  if (result.breakdown) {
    return flattenObject(result.breakdown);
  }
  // Fallback for new simulators that put data at the top level
  const { explanation, versionCode, versionId, calculatorType, ...rest } = result;
  return flattenObject(rest);
}

function pickKeyMetrics(snapshot: SimulationResultSnapshot): Array<[string, number]> {
  const breakdown = getEffectiveBreakdown(snapshot?.result);
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

import { getCompanySalaryBenchmarks, type AVisCompanySalaryBenchmarksResult } from "@/lib/avis-api";

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
  result: any,
  labels: Record<string, string> | undefined,
): BarEntry[] {
  const breakdown = getEffectiveBreakdown(result);
  const entries = Object.entries(breakdown)
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

function readStringRecordValue(
  record: Record<string, unknown>,
  keys: string[],
  extraMatchers: Array<(key: string) => boolean> = [],
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" && value.trim()) {
      if (keys.includes(key) || extraMatchers.some((matcher) => matcher(key))) {
        return value.trim();
      }
    }
  }

  return "";
}

function extractEmployerCompanyHint(inputPayload?: Record<string, unknown>): EmployerCompanyContext | null {
  if (!inputPayload) return null;

  const companyId = readStringRecordValue(inputPayload, [
    "company_id",
    "companyId",
    "employer_company_id",
    "employerCompanyId",
    "company_name_company_id",
    "employer_name_company_id",
  ], [(key) => key.endsWith("_company_id")]);

  const companyName = readStringRecordValue(inputPayload, [
    "company_name",
    "companyName",
    "employer_name",
    "employerName",
    "company",
    "employer",
  ]);

  if (!companyId && !companyName) return null;

  return {
    id: companyId,
    name: companyName,
  };
}

function buildSnapshotFromStoredItem(
  item: StoredSimulationItem,
  expectedPath: string,
  locale: string,
): SimulationResultSnapshot {
  const breakdown = ((item.result as { breakdown?: Record<string, string | number | boolean> }).breakdown ??
    {}) as Record<string, string | number | boolean>;
  const labels = Object.fromEntries(Object.keys(breakdown).map((key) => [key, key]));
  const resultPayload = item.result as {
    versionCode?: string;
    breakdown?: Record<string, string | number | boolean>;
    explanation?: {
      summary: string;
      assumptions: string[];
      formulas: string[];
      warnings: string[];
      nextSteps: string[];
      confidence?: {
        level: "low" | "medium" | "high";
        label?: string;
        note: string;
      };
      sources?: string[];
      missingInformation?: string[];
    };
  };

  return {
    calculatorPath: expectedPath,
    calculatorType: item.calculatorType,
    title: item.calculatorType,
    description: item.calculatorType,
    generatedAt: item.createdAt,
    breakdownLabels: labels,
    units: {},
    locale,
    inputPayload: item.input,
    result: {
      versionCode: resultPayload.versionCode ?? "ma_2026",
      breakdown,
      explanation: resultPayload.explanation,
    },
  };
}

export function SimulationResultPage({ slug, expectedPath: providedExpectedPath }: { slug: string; expectedPath?: string }) {
  const { language, t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const expectedPath = providedExpectedPath ?? calculatorTypeToPath(slug) ?? `/simulate/${slug}`;
  const expectedCalculatorType = useMemo(() => pathToCalculatorType(expectedPath), [expectedPath]);
  const simulationId = searchParams.get("simulationId");
  const [mappedRelatedItems, setMappedRelatedItems] = useState<
    Array<{ title: string; description: string; href: string }>
  >([]);
  const [employerCompany, setEmployerCompany] = useState<EmployerCompanyContext | null>(null);
  const [salaryBenchmarks, setSalaryBenchmarks] = useState<AVisCompanySalaryBenchmarksResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>();
  const relatedLabels =
    language === "ar"
      ? {
          toolsTitle: "خطوات مرتبطة",
          toolsDescription: "واصل من النتيجة الى الاداة التالية المناسبة.",
          modelsTitle: "نماذج مفيدة",
          modelsDescription: "انتقل مباشرة الى الرسائل والنماذج المرتبطة بهذه النتيجة.",
          articlesTitle: "شروحات عملية",
          articlesDescription: "راجع الشرح المختصر قبل المتابعة او التصعيد.",
        }
      : {
          toolsTitle: "Outils lies",
          toolsDescription: "Passez du resultat a l'outil suivant le plus utile.",
          modelsTitle: "Modeles utiles",
          modelsDescription: "Accedez directement aux lettres et modeles lies a ce resultat.",
          articlesTitle: "Guides pratiques",
          articlesDescription: "Consultez l'explication utile avant la prochaine etape.",
        };
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
      if (!parsed?.calculatorType) return null;
      const canonical = calculatorTypeToPath(parsed.calculatorType);
      if (!savedSimulationPathMatches(expectedPath, parsed.calculatorType, canonical)) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [expectedPath, snapshotRaw]);
  const resolvedSnapshot = historySnapshot ?? snapshot;
  const prefilledDocumentCTA = resolvedSnapshot ? buildPrefilledDocumentLink(resolvedSnapshot) : null;
  const keyMetrics = useMemo(() => (resolvedSnapshot ? pickKeyMetrics(resolvedSnapshot) : []), [resolvedSnapshot]);
  const flattenedBreakdown = useMemo(
    () => (resolvedSnapshot ? getEffectiveBreakdown(resolvedSnapshot.result) : {}),
    [resolvedSnapshot],
  );
  const breakdownEntries = useMemo(
    () =>
      resolvedSnapshot
        ? Object.entries(flattenedBreakdown).filter(([key]) => (resolvedSnapshot.breakdownLabels ?? {})[key])
        : [],
    [flattenedBreakdown, resolvedSnapshot],
  );
  const employerHint = useMemo(
    () => extractEmployerCompanyHint(resolvedSnapshot?.inputPayload),
    [resolvedSnapshot],
  );

  const showPieChart = resolvedSnapshot ? PIE_CHART_TYPES.has(resolvedSnapshot.calculatorType) : false;
  const showBarChart = resolvedSnapshot ? BAR_CHART_TYPES.has(resolvedSnapshot.calculatorType) : false;

  const pieData = useMemo<PieSlice[]>(
    () => (resolvedSnapshot && showPieChart ? buildPieData(flattenedBreakdown) : []),
    [flattenedBreakdown, resolvedSnapshot, showPieChart],
  );
  const barData = useMemo<BarEntry[]>(
    () =>
      resolvedSnapshot && showBarChart
        ? buildBarData(resolvedSnapshot.result, resolvedSnapshot.breakdownLabels)
        : [],
    [resolvedSnapshot, showBarChart],
  );

  useEffect(() => {
    if (!simulationId || snapshot) return;

    let active = true;
    fetch(`/api/simulations/${encodeURIComponent(simulationId)}`, { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }: { response: Response; data: { ok?: boolean; item?: StoredSimulationItem } }) => {
        if (!active || !response.ok || !data.ok || !data.item) {
          if (active) setHistorySnapshot(null);
          return;
        }

        const canonical = calculatorTypeToPath(data.item.calculatorType);
        if (!savedSimulationPathMatches(expectedPath, data.item.calculatorType, canonical)) {
          setHistorySnapshot(null);
          return;
        }
        setHistorySnapshot(buildSnapshotFromStoredItem(data.item, expectedPath, locale));
      })
      .catch(() => {
        if (active) setHistorySnapshot(null);
      });

    return () => {
      active = false;
    };
  }, [expectedPath, locale, simulationId, snapshot]);

  useEffect(() => {
    if (simulationId || snapshot) return;

    let active = true;
    fetch("/api/simulations", { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(
        ({ response, data }: { response: Response; data: { ok?: boolean; items?: StoredSimulationItem[] } }) => {
          if (!active || !response.ok || !data.ok || !Array.isArray(data.items)) return;

          const matchedItem = data.items.find((item) => {
            if (expectedCalculatorType) {
              return item.calculatorType === expectedCalculatorType;
            }
            const canonical = calculatorTypeToPath(item.calculatorType);
            return savedSimulationPathMatches(expectedPath, item.calculatorType, canonical);
          });

          if (!matchedItem) return;
          setHistorySnapshot(buildSnapshotFromStoredItem(matchedItem, expectedPath, locale));
        },
      )
      .catch(() => {
        // Best-effort fallback for direct result URL access.
      });

    return () => {
      active = false;
    };
  }, [expectedCalculatorType, expectedPath, locale, simulationId, snapshot]);

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

  useEffect(() => {
    if (!employerHint) {
      setEmployerCompany(null);
      return;
    }

    if (employerHint.id) {
      setEmployerCompany({
        id: employerHint.id,
        name: employerHint.name || "Entreprise",
      });
      return;
    }

    if (!employerHint.name) {
      setEmployerCompany(null);
      return;
    }

    const employerName = employerHint.name;
    let active = true;

    async function resolveEmployer() {
      try {
        const response = await fetch("/api/reviewly/companies/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName: employerName }),
        });

        if (!response.ok) {
          if (active) setEmployerCompany({ id: "", name: employerName });
          return;
        }

        const data = (await response.json()) as {
          companyId?: string | null;
          confidence?: "high" | "medium" | "low" | "none";
        };

        if (!active) return;

        if (data.companyId && data.confidence === "high") {
          setEmployerCompany({ id: data.companyId, name: employerName });
          return;
        }

        setEmployerCompany({ id: "", name: employerName });
      } catch {
        if (active) {
          setEmployerCompany({ id: "", name: employerName });
        }
      }
    }

    void resolveEmployer();

    return () => {
      active = false;
    };
  }, [employerHint]);

  useEffect(() => {
    if (!employerCompany?.id || resolvedSnapshot?.calculatorType !== "salaire") {
      setSalaryBenchmarks(null);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const data = await getCompanySalaryBenchmarks(employerCompany.id);
        if (active) setSalaryBenchmarks(data);
      } catch (err) {
        console.error("Failed to load salary benchmarks", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [employerCompany?.id, resolvedSnapshot?.calculatorType]);

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
    const breakdown = getEffectiveBreakdown(safeSnapshot.result);
    const lines = Object.entries(breakdown)
      .filter(([key]) => (safeSnapshot.breakdownLabels ?? {})[key])
      .map(([key, value]) => {
        const label = localizeBreakdownLabel(key, (safeSnapshot.breakdownLabels ?? {})[key] ?? key, language);
        return `${label}: ${formatValue(value, safeSnapshot.locale, t, (safeSnapshot.units ?? {})[key])}`;
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

  const explanation = resolvedSnapshot.result.explanation;
  const explanationWarnings = explanation?.warnings?.slice(0, 3) ?? [];
  const explanationNextSteps = explanation?.nextSteps?.slice(0, 3) ?? [];
  const explanationText =
    language === "ar"
      ? {
          title: "Ø®Ù„Ø§ØµØ© Ø§Ù„Ù†ØªÙŠØ¬Ø©",
          warnings: "Ù†Ù‚Ø§Ø· Ø§Ù†ØªØ¨Ø§Ù‡",
          nextSteps: "Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©",
          noWarnings: "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªØ­Ø°ÙŠØ±Ø§Øª Ù…Ø¶Ø§ÙÙŠØ©.",
          noNextSteps: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø®Ø·ÙˆØ§Øª Ù…Ù‚ØªØ±Ø­Ø©.",
        }
      : {
          title: "Synthese du Resultat",
          warnings: "Points d'Attention",
          nextSteps: "Prochaines Etapes",
          noWarnings: "Aucune alerte supplementaire.",
          noNextSteps: "Aucune etape recommandee.",
        };
  const resultState: "success" | "warning" | "empty" =
    breakdownEntries.length === 0 ? "empty" : explanationWarnings.length > 0 ? "warning" : "success";
  const resultStateMeta =
    resultState === "success"
      ? {
          badgeClass: "status-success",
          title: language === "ar" ? "Etat: Valide" : "Etat: Resultat complet",
          description:
            language === "ar"
              ? "Le calcul est disponible avec donnees exploitables."
              : "Le calcul est disponible avec des donnees exploitables.",
        }
      : resultState === "warning"
        ? {
            badgeClass: "status-warning",
            title: language === "ar" ? "Etat: Attention" : "Etat: Points d'attention",
            description:
              language === "ar"
                ? "Certaines hypotheses demandent verification avant decision."
                : "Certaines hypotheses demandent verification avant decision.",
          }
        : {
            badgeClass: "status-info",
            title: language === "ar" ? "Etat: Donnees insuffisantes" : "Etat: Donnees insuffisantes",
            description:
              language === "ar"
                ? "Le calcul ne contient pas encore assez de details a exploiter."
                : "Le calcul ne contient pas encore assez de details a exploiter.",
          };

  return (
    <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
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
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold print:hidden">
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
          <div className={`${resultStateMeta.badgeClass} mt-4 rounded-2xl px-3 py-2 text-sm`}>
            <p className="font-semibold">{resultStateMeta.title}</p>
            <p className="mt-1 text-xs">{resultStateMeta.description}</p>
          </div>
          <Link href={expectedPath} className="mt-3 inline-block text-sm font-semibold text-[var(--accent)] print:hidden">
            {t("resultPage.backToForm")}
          </Link>
        </section>

        {explanation ? (
          <section className="soft-card mt-4 rounded-3xl p-5">
            <p className="section-kicker">{explanationText.title}</p>
            <p className="mt-2 text-sm text-[var(--foreground)]">{explanation.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <article className="panel-strong rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">{explanationText.warnings}</p>
                {explanationWarnings.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
                    {explanationWarnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>- {warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{explanationText.noWarnings}</p>
                )}
              </article>
              <article className="panel-strong rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">{explanationText.nextSteps}</p>
                {explanationNextSteps.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
                    {explanationNextSteps.map((step, index) => (
                      <li key={`${step}-${index}`}>{index + 1}. {step}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{explanationText.noNextSteps}</p>
                )}
              </article>
            </div>
          </section>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)] lg:items-start print:grid-cols-1">
          <section className="min-w-0 space-y-4">
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
              <section className="soft-card overflow-hidden min-w-0 rounded-3xl p-5">
                <p className="section-kicker">Répartition salariale</p>
                <div className="mt-3">
                  <BreakdownPieChart data={pieData} />
                </div>
              </section>
            ) : null}

            {showBarChart && barData.length > 0 ? (
              <section className="soft-card overflow-hidden min-w-0 rounded-3xl p-5">
                <p className="section-kicker">Projection</p>
                <div className="mt-3">
                  <TimelineBarChart data={barData} />
                </div>
              </section>
            ) : null}

            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{t("resultPage.breakdownTitle")}</p>
              {breakdownEntries.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  {breakdownEntries.map(([key, value]) => (
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
              ) : (
                <div className="status-info mt-3 rounded-xl px-3 py-2 text-sm">
                  Les donnees de detail ne sont pas encore disponibles pour cette execution.
                </div>
              )}
            </section>
          </section>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 print:hidden">
            <section className="soft-card min-w-0 rounded-3xl p-5">
              <p className="section-kicker">{t("resultPage.actionsTitle")}</p>
              <div className="mt-3 flex flex-col gap-2 text-sm break-words">
                <Link href={expectedPath} className="btn-muted px-4 py-2 text-center">
                  {t("resultPage.editParams")}
                </Link>
                <button type="button" onClick={copySummary} className="btn-muted px-4 py-2 text-center">
                  {t("resultPage.copySummary")}
                </button>
                <button type="button" onClick={() => window.print()} className="btn-muted px-4 py-2 text-center">
                  {t("resultPage.print")}
                </button>
                <Link href="/simulate" className="btn-primary px-4 py-2 text-center">
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
              <p className="section-kicker">Contexte employeur</p>
              <div className="mt-3 space-y-3">
                {employerCompany?.id ? (
                  <CompanyTrustSummary companyId={employerCompany.id} />
                ) : null}
                
                {salaryBenchmarks?.salaryBenchmarks && (
                  <div className="rounded-2xl border border-[var(--accent-soft)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)] p-4 shadow-sm">
                    <p className="section-kicker text-[var(--accent)]">Insights Marché (Avisine)</p>
                    <p className="mt-1 text-sm font-semibold">
                      Salaire médian : {salaryBenchmarks.salaryBenchmarks.medianMonthlySalary?.toLocaleString() ?? "N/A"} MAD
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Basé sur {salaryBenchmarks.salaryBenchmarks.submissionCount} avis vérifiés.
                      {salaryBenchmarks.salaryBenchmarks.pctAboveCityAvg ? ` (${salaryBenchmarks.salaryBenchmarks.pctAboveCityAvg}% au-dessus de la moyenne ville)` : ""}
                    </p>
                  </div>
                )}

                <AvisinePromoCard
                  type={
                    resolvedSnapshot.calculatorType === "licenciement" ||
                      resolvedSnapshot.calculatorType === "unpaid_salary_recovery"
                      ? "conflict"
                      : resolvedSnapshot.calculatorType === "salaire"
                        ? "salary_benchmark"
                        : "general"
                  }
                  company={employerCompany && employerCompany.name ? employerCompany : null}
                />
                {employerCompany?.id ? (
                  <CompanyContextCard
                    companyId={employerCompany.id}
                    companyName={employerCompany.name}
                  />
                ) : null}
              </div>
            </section>

            <SimulationCaseWorkflow
              snapshot={resolvedSnapshot}
              locale={resolvedSnapshot.locale}
              sourceSimulationId={simulationId ?? undefined}
              company={employerCompany}
            />

            <PartnerAdSection slot="4545454545" />
          </aside>
        </div>

        <div className="print:hidden">
          <SimulationExplanation explanation={resolvedSnapshot.result.explanation} />
          <RelatedContent
            items={
              (mappedRelatedItems ?? []).length > 0
                ? mappedRelatedItems
                : [
                  {
                    title: relatedLabels.toolsTitle,
                    description: relatedLabels.toolsDescription,
                    href: "/salaire",
                  },
                  {
                    title: relatedLabels.modelsTitle,
                    description: relatedLabels.modelsDescription,
                    href: "/modeles",
                  },
                  {
                    title: relatedLabels.articlesTitle,
                    description: relatedLabels.articlesDescription,
                    href: "/articles",
                  },
                ]
            }
          />
        </div>
        <p className="mt-8 hidden text-center text-[10px] text-[var(--ink-soft)] print:block">
          {t("common.generatedOn")} {SITE_URL}
        </p>
      </div>
    </main>
  );
}
