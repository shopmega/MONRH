"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";
import { localizeCalculatorTitle } from "@/lib/i18n/simulator-localization";
import { calculatorTypeToPath } from "@/lib/simulations/calculator-path";

type SimulationItem = {
  id: string;
  createdAt: string;
  calculatorType: string;
  result?: {
    breakdown?: Record<string, unknown>;
  };
};

type DocumentItem = {
  id: string;
  createdAt: string;
  templateTitle: string;
};

type ViolationItem = {
  id: string;
  createdAt: string;
  type: string;
  description: string;
};

type OvertimeItem = {
  id: string;
  createdAt: string;
  workDate: string;
  hoursDay: number;
  hoursNight: number;
  hoursWeekend: number;
  hoursHoliday: number;
};

type ActivityItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  kind: "simulation" | "document" | "tool";
  href?: string;
};

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale);
}

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function ComptePage() {
  const { t, locale, language } = useLanguage();
  const router = useRouter();
  const [simulations, setSimulations] = useState<SimulationItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeItem[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [simRes, docRes, violationsRes, overtimeRes] = await Promise.all([
          fetch("/api/simulations"),
          fetch("/api/documents/generated"),
          fetch("/api/journal/violations"),
          fetch("/api/journal/overtime"),
        ]);

        const [simData, docData, violationsData, overtimeData] = await Promise.all([
          readJsonSafe<{ items?: SimulationItem[] }>(simRes),
          readJsonSafe<{ items?: DocumentItem[] }>(docRes),
          readJsonSafe<{ items?: ViolationItem[] }>(violationsRes),
          readJsonSafe<{ items?: OvertimeItem[] }>(overtimeRes),
        ]);

        if (!active) return;
        setSimulations(simRes.ok ? simData?.items ?? [] : []);
        setDocuments(docRes.ok ? docData?.items ?? [] : []);
        setViolations(violationsRes.ok ? violationsData?.items ?? [] : []);
        setOvertimeLogs(overtimeRes.ok ? overtimeData?.items ?? [] : []);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function logoutUserSession() {
    setLoggingOut(true);
    setSessionStatus(undefined);
    try {
      const response = await fetch("/api/user/session", { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean };
      if (!response.ok || !data.ok) {
        setSessionStatus(t("accountPage.sessionDenied"));
        return;
      }
      window.dispatchEvent(new Event("salarie-auth-changed"));
      router.replace("/connexion?next=/compte");
      router.refresh();
    } catch {
      setSessionStatus(t("accountPage.sessionDenied"));
    } finally {
      setLoggingOut(false);
    }
  }

  const activity = useMemo<ActivityItem[]>(() => {
    const simulationActivity: ActivityItem[] = simulations.map((item) => ({
      id: `s-${item.id}`,
      title: `${t("accountPage.simulationPrefix")} ${localizeCalculatorTitle(item.calculatorType, item.calculatorType, language)}`,
      date: item.createdAt,
      status: t("accountPage.saved"),
      kind: "simulation",
      href: (() => {
        const path = calculatorTypeToPath(item.calculatorType);
        return path ? `${path}/result?simulationId=${encodeURIComponent(item.id)}` : undefined;
      })(),
    }));

    const documentActivity: ActivityItem[] = documents.map((item) => ({
      id: `d-${item.id}`,
      title: item.templateTitle,
      date: item.createdAt,
      status: t("accountPage.documentCreated"),
      kind: "document",
    }));

    const violationActivity: ActivityItem[] = violations.map((item) => ({
      id: `v-${item.id}`,
      title:
        language === "ar"
          ? `سجل مخالفة: ${item.type}`
          : `Journal infraction: ${item.type}`,
      date: item.createdAt,
      status: t("accountPage.saved"),
      kind: "tool",
      href: "/journal/violations",
    }));

    const overtimeActivity: ActivityItem[] = overtimeLogs.map((item) => ({
      id: `o-${item.id}`,
      title:
        language === "ar"
          ? "سجل ساعات إضافية"
          : "Journal heures supplementaires",
      date: item.createdAt,
      status: t("accountPage.saved"),
      kind: "tool",
      href: "/journal/overtime",
    }));

    return [...simulationActivity, ...documentActivity, ...violationActivity, ...overtimeActivity]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [documents, language, overtimeLogs, simulations, t, violations]);

  const seniorityValue = useMemo(() => {
    const dates = [
      ...simulations.map((item) => new Date(item.createdAt)),
      ...documents.map((item) => new Date(item.createdAt)),
    ].filter((date) => !Number.isNaN(date.getTime()));
    if (dates.length === 0) return t("accountPage.notEvaluated");

    const oldest = dates.reduce((min, current) => (current < min ? current : min), dates[0]);
    const now = new Date();
    const totalMonths = Math.max(
      0,
      (now.getFullYear() - oldest.getFullYear()) * 12 + (now.getMonth() - oldest.getMonth()),
    );
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return language === "ar" ? `${years} سنة ${months} شهر` : `${years} ans ${months} mois`;
  }, [documents, language, simulations, t]);

  const smigStatus = useMemo(() => {
    const latestSmig = simulations
      .filter((item) => item.calculatorType === "smig_compliance")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const compliant = latestSmig?.result?.breakdown?.compliant;
    if (typeof compliant !== "boolean") {
      return t("accountPage.notEvaluated");
    }
    return compliant ? t("accountPage.compliant") : t("accountPage.nonCompliant");
  }, [simulations, t]);

  const stats = [
    { label: t("common.simulationsLabel"), value: simulations.length.toString() },
    { label: t("common.documentsLabel"), value: documents.length.toString() },
    { label: t("nav.tools"), value: (violations.length + overtimeLogs.length).toString() },
    { label: t("accountPage.yearsSeniority"), value: seniorityValue },
    { label: t("accountPage.smigStatus"), value: smigStatus },
  ];

  return (
    <main className="paper-bg min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card overflow-hidden rounded-[2rem]">
          <div className="bg-gradient-to-r from-[var(--accent-soft)] via-transparent to-[var(--surface-elevated)] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-kicker">{t("accountPage.kicker")}</p>
                <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
                  {t("accountPage.title")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
                  {t("accountPage.description")}
                </p>
              </div>
              <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
                <Link href="/simulateurs" className="btn-primary w-full px-4 py-2 text-xs uppercase tracking-[0.12em] sm:w-auto">
                  {t("accountPage.newSimulation")}
                </Link>
                <button
                  type="button"
                  onClick={logoutUserSession}
                  disabled={loggingOut}
                  className="btn-muted w-full px-4 py-2 text-xs uppercase tracking-[0.12em] sm:w-auto"
                >
                  {loggingOut ? t("common.loading") : t("accountPage.sessionLogout")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((item) => (
            <article
              key={item.label}
              className="soft-card rounded-2xl border border-[var(--line)]/70 p-4"
            >
              <div className="mb-3 h-1.5 w-10 rounded-full bg-[var(--accent)]/70" />
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{item.label}</p>
              <p className="display-font mt-2 text-3xl font-semibold">{item.value}</p>
            </article>
          ))}
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <section className="soft-card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="display-font text-3xl font-semibold">{t("accountPage.recentHistory")}</h2>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                {activity.length}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {t("accountPage.sessionLabel")}:{" "}
              <span className="font-semibold text-[var(--foreground)]">{t("accountPage.sessionConnected")}</span>
            </p>
            {sessionStatus ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{sessionStatus}</p> : null}

            <div className="mt-4 space-y-2">
              {loading ? (
                <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                  {t("common.loading")}
                </div>
              ) : activity.length === 0 ? (
                <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                  {t("common.noData")}
                </div>
              ) : (
                activity.map((item) => {
                  const content = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 font-semibold">{item.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                            item.kind === "simulation"
                              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"
                          }`}
                        >
                          {item.kind}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
                        <span>
                          {formatDate(item.date, locale)} | {item.status}
                        </span>
                        {item.href ? <span className="text-[var(--accent)]">{t("common.open")}</span> : null}
                      </div>
                    </>
                  );

                  return item.href ? (
                    <Link key={item.id} href={item.href} className="panel-strong block rounded-2xl p-3">
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id} className="panel-strong rounded-2xl p-3">
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="soft-card rounded-3xl p-4">
              <p className="section-kicker">{t("common.explore")}</p>
              <div className="mt-3 space-y-2">
                <Link href="/compte/protection" className="panel-strong block rounded-2xl p-3">
                  <p className="font-semibold">{t("accountPage.shortcutProtection")}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("accountPage.shortcutProtectionDesc")}</p>
                </Link>
                <Link href="/outils/detecteur-fiche-paie" className="panel-strong block rounded-2xl p-3">
                  <p className="font-semibold">{t("accountPage.shortcutPayslip")}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("accountPage.shortcutPayslipDesc")}</p>
                </Link>
                <Link href="/journal/violations" className="panel-strong block rounded-2xl p-3">
                  <p className="font-semibold">{t("accountPage.shortcutViolations")}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("accountPage.shortcutViolationsDesc")}</p>
                </Link>
              </div>
            </section>

            <section>
              <p className="section-kicker pl-1">{t("common.partner")}</p>
              <div className="soft-card mt-2 rounded-3xl p-3">
                <AdSlot slot="9999999999" format="auto" />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
