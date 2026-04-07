"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";
import { localizeCalculatorTitle } from "@/lib/i18n/simulator-localization";
import { calculatorTypeToPath } from "@/lib/simulations/calculator-path";
import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

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

type ContractItem = {
  id: string;
  createdAt: string;
  templateTitle: string;
  contractType: string;
};

type CaseItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  status: string;
  caseType: string;
  companyName?: string | null;
  sourceSimulationId?: string | null;
  timeline?: {
    documents?: Array<{
      id: string;
      templateTitle?: string;
      createdAt?: string;
    }>;
  };
};

type VerificationItem = {
  id: string;
  status: string;
  companyName?: string | null;
  sourceCaseId?: string | null;
  createdAt: string;
};

type EvidenceArtifactItem = {
  id: string;
  title: string;
  caseId?: string | null;
  companyName?: string | null;
  createdAt: string;
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
  kind: "simulation" | "document" | "tool" | "contract";
  href?: string;
};

const TOOL_LABEL_BY_ID = Object.fromEntries(TOOL_CATALOG.map((tool) => [tool.id, tool.label]));

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
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [evidenceArtifacts, setEvidenceArtifacts] = useState<EvidenceArtifactItem[]>([]);
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeItem[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const responses = await Promise.all([
          fetch("/api/simulations"),
          fetch("/api/documents/generated"),
          fetch("/api/cases"),
          fetch("/api/verifications?limit=20"),
          fetch("/api/evidence-artifacts?limit=20"),
          fetch("/api/journal/violations"),
          fetch("/api/journal/overtime"),
          fetch("/api/contracts/user")
        ]);

        const [simRes, docRes, caseRes, verificationRes, evidenceRes, violationsRes, overtimeRes, contractsRes] = responses;

        const dataObjects = await Promise.all([
          readJsonSafe<{ items?: SimulationItem[] }>(simRes),
          readJsonSafe<{ items?: DocumentItem[] }>(docRes),
          readJsonSafe<{ items?: CaseItem[] }>(caseRes),
          readJsonSafe<{ items?: VerificationItem[] }>(verificationRes),
          readJsonSafe<{ items?: EvidenceArtifactItem[] }>(evidenceRes),
          readJsonSafe<{ items?: ViolationItem[] }>(violationsRes),
          readJsonSafe<{ items?: OvertimeItem[] }>(overtimeRes),
          readJsonSafe<{ items?: ContractItem[] }>(contractsRes)
        ]);

        const [simData, docData, caseData, verificationData, evidenceData, violationsData, overtimeData, contractsData] = dataObjects;

        if (!active) return;
        setSimulations(simRes.ok ? simData?.items ?? [] : []);
        setDocuments(docRes.ok ? docData?.items ?? [] : []);
        setCases(caseRes.ok ? caseData?.items ?? [] : []);
        setVerifications(verificationRes.ok ? verificationData?.items ?? [] : []);
        setEvidenceArtifacts(evidenceRes.ok ? evidenceData?.items ?? [] : []);
        setViolations(violationsRes.ok ? violationsData?.items ?? [] : []);
        setOvertimeLogs(overtimeRes.ok ? overtimeData?.items ?? [] : []);
        setContracts(contractsRes.ok ? contractsData?.items ?? [] : []);
      } catch (error) {
        console.error("Failed to load account data:", error);
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
      title: `${t("accountPage.simulationPrefix")} ${localizeCalculatorTitle(
        item.calculatorType,
        TOOL_LABEL_BY_ID[item.calculatorType] ?? item.calculatorType,
        language,
      )}`,
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

    const contractActivity: ActivityItem[] = contracts.map((item) => ({
      id: `ct-${item.id}`,
      title: `Contrat: ${item.templateTitle}`,
      date: item.createdAt,
      status: "Généré",
      kind: "contract",
      href: `/compte/contrats`,
    }));

    const caseActivity: ActivityItem[] = cases.map((item) => ({
      id: `c-${item.id}`,
      title: item.companyName ? `${item.title} - ${item.companyName}` : item.title,
      date: item.createdAt,
      status: item.status,
      kind: "tool",
      href: `/compte/dossiers/${encodeURIComponent(item.id)}`,
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

    return [...simulationActivity, ...documentActivity, ...contractActivity, ...caseActivity, ...violationActivity, ...overtimeActivity]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [cases, documents, contracts, language, overtimeLogs, simulations, t, violations]);

  const seniorityValue = useMemo(() => {
    const dates = [
      ...simulations.map((item) => new Date(item.createdAt)),
      ...documents.map((item) => new Date(item.createdAt)),
      ...contracts.map((item) => new Date(item.createdAt)),
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
  }, [documents, contracts, language, simulations, t]);

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
    { label: "Contrats", value: contracts.length.toString() },
    { label: "Dossiers", value: cases.length.toString() },
    { label: "Verifications", value: verifications.length.toString() },
    { label: "Preuves", value: evidenceArtifacts.length.toString() },
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
                <Link href="/salaire" className="btn-primary w-full px-4 py-2 text-xs uppercase tracking-[0.12em] sm:w-auto">
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

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          <div className="space-y-4">
          <section className="soft-card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="display-font text-3xl font-semibold">Mes Contrats Premium</h2>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                {contracts.length}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Accédez à vos contrats de travail générés et téléchargez-les.
            </p>
            <div className="mt-4 space-y-2">
              {loading ? (
                <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                  {t("common.loading")}
                </div>
              ) : contracts.length === 0 ? (
                <Link href="/contrat" className="panel-strong block rounded-2xl p-4 text-center border-dashed border-2 border-[var(--line)] hover:border-[var(--accent)] transition-colors">
                  <p className="text-sm font-medium text-[var(--accent)]">Générer mon premier contrat</p>
                </Link>
              ) : (
                <>
                {contracts.slice(0, 3).map((item) => (
                  <Link key={item.id} href={`/compte/contrats`} className="panel-strong block rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-semibold">{item.templateTitle}</p>
                      <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        {item.contractType}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      Généré le {formatDate(item.createdAt, locale)}
                    </div>
                  </Link>
                ))}
                {contracts.length > 3 && (
                  <Link href="/compte/contrats" className="block text-center text-xs font-semibold text-[var(--accent)] pt-2">
                    Voir les {contracts.length} contrats
                  </Link>
                )}
                </>
              )}
            </div>
          </section>

          <section className="soft-card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="display-font text-3xl font-semibold">Mon dossier</h2>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                {cases.length}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Vos cas sauvegardes, lies a une simulation et prets pour la suite.
            </p>
            <div className="mt-4 space-y-2">
              {loading ? (
                <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                  {t("common.loading")}
                </div>
              ) : cases.length === 0 ? (
                <div className="panel-strong rounded-2xl p-3 text-sm text-[var(--ink-soft)]">
                  Aucun dossier sauvegarde.
                </div>
              ) : (
                cases.slice(0, 4).map((item) => {
                  const href = `/compte/dossiers/${encodeURIComponent(item.id)}`;
                  const linkedDocuments = Array.isArray(item.timeline?.documents) ? item.timeline.documents : [];
                  const content = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 font-semibold">{item.title}</p>
                        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-[var(--ink-soft)]">
                        {item.companyName || item.caseType} | {formatDate(item.createdAt, locale)}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--ink-soft)]">
                        <span>
                          Mis a jour le {formatDate(item.updatedAt || item.createdAt, locale)}
                        </span>
                        <span>
                          {linkedDocuments.length} document{linkedDocuments.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </>
                  );

                  return href ? (
                    <Link key={item.id} href={href} className="panel-strong block rounded-2xl p-3">
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

          <section className="soft-card rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="display-font text-3xl font-semibold">{t("accountPage.recentHistory")}</h2>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                {activity.length}
              </span>
            </div>
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
                              : item.kind === "contract"
                              ? "bg-emerald-100 text-emerald-700"
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
          </div>

          <aside className="space-y-4">
            <section className="soft-card rounded-3xl p-4">
              <p className="section-kicker">{t("common.explore")}</p>
              <div className="mt-3 space-y-2">
                <Link href="/compte/contrats" className="panel-strong block rounded-2xl p-3 border border-[var(--accent)]/20 shadow-sm">
                  <p className="font-semibold text-[var(--accent)]">Générateur de Contrat</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">Accédez à votre historique legal et créez de nouveaux contrats.</p>
                </Link>
                <div className="panel-strong rounded-2xl p-3">
                  <p className="font-semibold">Verification emploi</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {verifications.filter((item) => item.status === "pending").length} verification(s) en attente.
                  </p>
                  <Link href="/compte/verifications" className="mt-2 inline-flex text-xs font-semibold text-[var(--accent)]">
                    Ouvrir la boite de verification
                  </Link>
                </div>
                <Link href="/compte/protection" className="panel-strong block rounded-2xl p-3">
                  <p className="font-semibold">{t("accountPage.shortcutProtection")}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("accountPage.shortcutProtectionDesc")}</p>
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
