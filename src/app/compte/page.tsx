"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { useLanguage } from "@/components/language-provider";
import { localizeCalculatorTitle } from "@/lib/i18n/simulator-localization";
import { calculatorTypeToPath } from "@/lib/simulations/calculator-path";
import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

type SimulationItem = { id: string; createdAt: string; calculatorType: string; result?: { breakdown?: Record<string, unknown> }; };
type DocumentItem = { id: string; createdAt: string; templateTitle: string; };
type ContractItem = { id: string; createdAt: string; templateTitle: string; contractType: string; };
type CaseItem = { id: string; createdAt: string; updatedAt: string; title: string; status: string; caseType: string; companyName?: string | null; sourceSimulationId?: string | null; timeline?: { documents?: Array<{ id: string; templateTitle?: string; createdAt?: string; }>; }; };
type VerificationItem = { id: string; status: string; companyName?: string | null; sourceCaseId?: string | null; createdAt: string; };
type EvidenceArtifactItem = { id: string; title: string; caseId?: string | null; companyName?: string | null; createdAt: string; };
type ViolationItem = { id: string; createdAt: string; type: string; description: string; };
type OvertimeItem = { id: string; createdAt: string; workDate: string; hoursDay: number; hoursNight: number; hoursWeekend: number; hoursHoliday: number; };
type ActivityItem = { id: string; title: string; date: string; status: string; kind: "simulation" | "document" | "tool" | "contract"; href?: string; };

const TOOL_LABEL_BY_ID = Object.fromEntries(TOOL_CATALOG.map((t) => [t.id, t.label]));

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale);
}

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try { return (await response.json()) as T; } catch { return null; }
}

const STATUS_COLORS: Record<string, string> = {
  simulation: "bg-[#FFF0E6] text-[#8a5022]",
  contract: "bg-[#E6F4EF] text-[#1e6b4a]",
  document: "bg-[#EEF0FF] text-[#4050c8]",
  tool: "bg-[#F0EAE4] text-[#52443b]",
};

const EXPERTISE_DOMAINS = [
  { icon: "⚖️", label: "Droit du Travail" },
  { icon: "💼", label: "Gestion RH" },
  { icon: "📋", label: "Contrats & Conventions" },
  { icon: "🏛️", label: "Protection Sociale" },
];

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
          fetch("/api/contracts/user"),
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
          readJsonSafe<{ items?: ContractItem[] }>(contractsRes),
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
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function logoutUserSession() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/user/session", { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean };
      if (!response.ok || !data.ok) return;
      window.dispatchEvent(new Event("salarie-auth-changed"));
      router.replace("/connexion?next=/compte");
      router.refresh();
    } catch { /* no-op */ } finally {
      setLoggingOut(false);
    }
  }

  const activity = useMemo<ActivityItem[]>(() => {
    return [
      ...simulations.map((item) => ({
        id: `s-${item.id}`,
        title: `${t("accountPage.simulationPrefix")} ${localizeCalculatorTitle(item.calculatorType, TOOL_LABEL_BY_ID[item.calculatorType] ?? item.calculatorType, language)}`,
        date: item.createdAt, status: t("accountPage.saved"), kind: "simulation" as const,
        href: (() => { const path = calculatorTypeToPath(item.calculatorType); return path ? `${path}/result?simulationId=${encodeURIComponent(item.id)}` : undefined; })(),
      })),
      ...documents.map((item) => ({ id: `d-${item.id}`, title: item.templateTitle, date: item.createdAt, status: t("accountPage.documentCreated"), kind: "document" as const })),
      ...contracts.map((item) => ({ id: `ct-${item.id}`, title: `Contrat: ${item.templateTitle}`, date: item.createdAt, status: "Généré", kind: "contract" as const, href: "/compte/contrats" })),
      ...cases.map((item) => ({ id: `c-${item.id}`, title: item.companyName ? `${item.title} - ${item.companyName}` : item.title, date: item.createdAt, status: item.status, kind: "tool" as const, href: `/compte/dossiers/${encodeURIComponent(item.id)}` })),
      ...violations.map((item) => ({ id: `v-${item.id}`, title: language === "ar" ? `سجل مخالفة: ${item.type}` : `Journal infraction: ${item.type}`, date: item.createdAt, status: t("accountPage.saved"), kind: "tool" as const, href: "/journal/violations" })),
      ...overtimeLogs.map((item) => ({ id: `o-${item.id}`, title: language === "ar" ? "سجل ساعات إضافية" : "Journal heures supplementaires", date: item.createdAt, status: t("accountPage.saved"), kind: "tool" as const, href: "/journal/overtime" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
  }, [cases, documents, contracts, language, overtimeLogs, simulations, t, violations]);

  const seniorityValue = useMemo(() => {
    const dates = [...simulations, ...documents, ...contracts].map((item) => new Date(item.createdAt)).filter((d) => !Number.isNaN(d.getTime()));
    if (dates.length === 0) return t("accountPage.notEvaluated");
    const oldest = dates.reduce((min, cur) => (cur < min ? cur : min), dates[0]);
    const now = new Date();
    const totalMonths = Math.max(0, (now.getFullYear() - oldest.getFullYear()) * 12 + (now.getMonth() - oldest.getMonth()));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return language === "ar" ? `${years} سنة ${months} شهر` : `${years} ans ${months} mois`;
  }, [documents, contracts, language, simulations, t]);

  const smigStatus = useMemo(() => {
    const latest = simulations.filter((item) => item.calculatorType === "smig_compliance").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const compliant = latest?.result?.breakdown?.compliant;
    if (typeof compliant !== "boolean") return t("accountPage.notEvaluated");
    return compliant ? t("accountPage.compliant") : t("accountPage.nonCompliant");
  }, [simulations, t]);

  const totalItems = simulations.length + documents.length + contracts.length + cases.length;

  return (
    <div className="min-h-screen bg-[#F8F5F2] font-sans pb-16">

      {/* ── PROFILE HEADER ─────────────────────────────────────────── */}
      <div className="bg-white px-5 pt-16 pb-6">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#F0EAE4] flex items-center justify-center text-2xl font-black text-[#8a5022]">
            M
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a5022]">jurisconsult</p>
            <p className="text-[18px] font-extrabold text-[#1a1a1a]">{t("accountPage.title")}</p>
          </div>
          <button
            onClick={logoutUserSession}
            disabled={loggingOut}
            className="ml-auto text-[11px] font-bold text-[#6b5e55] bg-[#F0EAE4] px-3 py-1.5 rounded-full"
          >
            {loggingOut ? "..." : "Déconnexion"}
          </button>
        </div>
        <p className="text-sm text-[#6b5e55] leading-relaxed mb-5">{t("accountPage.description")}</p>

        {/* Primary action */}
        <Link href="/salaire" className="block w-full bg-[#8a5022] text-white font-bold text-sm text-center py-3.5 rounded-2xl">
          + {t("accountPage.newSimulation")}
        </Link>
      </div>

      {/* ── PROFESSIONAL PORTFOLIO ────────────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="bg-[#8a5022] p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Portfolio</p>
            <h2 className="text-[22px] font-extrabold text-white leading-tight mb-1">
              {language === "ar" ? "بورتفوليو مهني" : "Professional\nPortfolio"}
            </h2>
            <p className="text-sm text-white/70 mt-2 mb-4 leading-relaxed">
              {language === "ar" ? "سجلك القانوني والمهني الشامل" : "Un aperçu consolidé de votre activité juridique et RH."}
            </p>
            {/* Stats pill */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                Legal Branding
              </span>
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                RH Pro
              </span>
            </div>
          </div>

          {/* Big stat */}
          <div className="px-6 py-5 border-b border-[#F0EAE4]">
            <div className="flex items-end gap-3">
              <span className="text-[52px] font-black text-[#8a5022] leading-none">
                {loading ? "·" : totalItems}
              </span>
              <div className="pb-2">
                <p className="text-[11px] font-bold text-[#1a1a1a]">Actions & Dossiers</p>
                <p className="text-[11px] text-[#6b5e55]">Activité jurisconsult</p>
              </div>
            </div>
            <p className="text-[11px] text-[#6b5e55] mt-1 font-semibold">
              {language === "ar" ? "الأقدمية:" : "Ancienneté:"} {seniorityValue}
            </p>
          </div>

          {/* Expertise Domains */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a5022] mb-3">
              Expertise Domains
            </p>
            <div className="space-y-2">
              {EXPERTISE_DOMAINS.map((d) => (
                <div key={d.label} className="flex items-center gap-3 py-1">
                  <span className="text-lg">{d.icon}</span>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: t("common.simulationsLabel"), value: simulations.length },
            { label: t("common.documentsLabel"), value: documents.length },
            { label: "Contrats", value: contracts.length },
            { label: "Dossiers", value: cases.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center">
              <p className="text-[22px] font-extrabold text-[#8a5022]">{loading ? "·" : s.value}</p>
              <p className="text-[9px] font-semibold text-[#6b5e55] mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPLIANCE STATUS ────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a5022] mb-3">
            Compliance Status Update
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-[#1a1a1a] mb-0.5">Statut SMIG</p>
              <p className="text-[11px] text-[#6b5e55]">Dernière vérification</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-black ${smigStatus.includes("Non") || smigStatus.includes("غير") ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#D1FAE5] text-[#065F46]"}`}>
              {smigStatus}
            </span>
          </div>

          {/* Verifications pending */}
          {verifications.filter((v) => v.status === "pending").length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#F0EAE4] flex items-center justify-between">
              <p className="text-[12px] text-[#6b5e55] font-semibold">
                {verifications.filter((v) => v.status === "pending").length} vérification(s) en attente
              </p>
              <Link href="/compte/verifications" className="text-[11px] font-bold text-[#8a5022]">
                Voir →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTRACTS ────────────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-extrabold text-[#1a1a1a]">Mes Contrats</p>
            <Link href="/compte/contrats" className="text-[11px] font-bold text-[#8a5022]">Voir tout →</Link>
          </div>

          {loading ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#8a5022] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contracts.length === 0 ? (
            <Link href="/contrat" className="block border-2 border-dashed border-[#F0EAE4] rounded-2xl p-5 text-center">
              <p className="text-[13px] font-bold text-[#8a5022]">Générer mon premier contrat →</p>
            </Link>
          ) : (
            <div className="space-y-2">
              {contracts.slice(0, 3).map((item) => (
                <Link key={item.id} href="/compte/contrats" className="flex items-center justify-between py-2.5 border-b border-[#F8F5F2] last:border-0">
                  <div>
                    <p className="text-[13px] font-bold text-[#1a1a1a] line-clamp-1">{item.templateTitle}</p>
                    <p className="text-[10px] text-[#6b5e55] mt-0.5">{formatDate(item.createdAt, locale)}</p>
                  </div>
                  <span className="bg-[#F0EAE4] text-[#8a5022] text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ml-3">
                    {item.contractType}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ACCOUNT INTEGRITY / DOSSIERS ─────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-extrabold text-[#1a1a1a]">Account Integrity</p>
            <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] font-bold px-2.5 py-1 rounded-full">Actif</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Dossiers Juridiques", value: cases.length, href: "/compte/dossiers" },
              { label: "Pièces à conviction", value: evidenceArtifacts.length, href: "/compte" },
              { label: "Infractions journalisées", value: violations.length, href: "/journal/violations" },
              { label: "Heures supp. enregistrées", value: overtimeLogs.length, href: "/journal/overtime" },
            ].map((row) => (
              <Link key={row.label} href={row.href} className="flex items-center justify-between py-2 border-b border-[#F8F5F2] last:border-0">
                <p className="text-[12px] font-semibold text-[#1a1a1a]">{row.label}</p>
                <span className="text-[13px] font-extrabold text-[#8a5022]">{loading ? "·" : row.value}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY TIMELINE ─────────────────────────────── */}
      {activity.length > 0 && (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-3xl p-5">
            <p className="text-[13px] font-extrabold text-[#1a1a1a] mb-4">{t("accountPage.recentHistory")}</p>
            <div className="space-y-3">
              {activity.slice(0, 8).map((item) => {
                const Wrapper = item.href ? Link : "div";
                const wrapperProps = item.href ? { href: item.href } : {};
                return (
                  <Wrapper key={item.id} {...(wrapperProps as any)} className="flex items-start gap-3">
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black ${STATUS_COLORS[item.kind] ?? STATUS_COLORS.tool}`}>
                      {item.kind[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0 border-b border-[#F8F5F2] pb-3">
                      <p className="text-[12px] font-bold text-[#1a1a1a] line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-[#6b5e55] mt-0.5">{formatDate(item.date, locale)}</p>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK SHORTCUTS ──────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a5022] mb-3 px-1">
          {t("common.explore")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Protection Droits", href: "/compte/protection" },
            { label: "Infractions", href: "/journal/violations" },
            { label: "Vérification emploi", href: "/compte/verifications" },
            { label: "Générer Contrat", href: "/contrat" },
          ].map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-[12px] font-bold text-[#1a1a1a]">{s.label}</p>
                <p className="text-[10px] text-[#8a5022] mt-1 font-semibold">Accéder →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── PARTNER AD ───────────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl p-3 overflow-hidden">
          <AdSlot slot="9999999999" format="auto" />
        </div>
      </div>
    </div>
  );
}
