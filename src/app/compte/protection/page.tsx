"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type Snapshot = {
  netSalary: number | null;
  grossSalary: number | null;
  cnssCompliance: boolean | null;
  leaveAccruedDays: number | null;
  leaveTakenDays: number | null;
  indemnityIfTerminatedToday: number | null;
  smigCompliance: boolean | null;
  overtimeOwedEstimate: number | null;
  updatedAt: string;
};

function money(value: number | null) {
  if (value === null) return "-";
  return `${value.toLocaleString("fr-MA")} MAD`;
}

export default function ProtectionPage() {
  const { t, locale } = useLanguage();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadSnapshot() {
      try {
        const response = await fetch("/api/protection/snapshot");
        const data = (await response.json()) as { ok: boolean; snapshot?: Snapshot };
        if (!active || !data.ok || !data.snapshot) return;
        setSnapshot(data.snapshot);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSnapshot();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{t("protectionPage.kicker")}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            {t("protectionPage.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--ink-soft)]">
            {t("protectionPage.description")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/outils/detecteur-fiche-paie" className="btn-primary px-4 py-2 text-sm">{t("protectionPage.payslipTool")}</Link>
            <Link href="/outils/alerte-retard-salaire" className="btn-muted px-4 py-2 text-sm">{t("protectionPage.salaryDelayTool")}</Link>
            <Link href="/outils/score-risque-conformite" className="btn-muted px-4 py-2 text-sm">{t("protectionPage.complianceTool")}</Link>
          </div>
        </section>

        {loading ? (
          <section className="soft-card mt-5 rounded-3xl p-5 text-sm text-[var(--ink-soft)]">{t("common.loading")}</section>
        ) : (
          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="soft-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.netSalary")}</p>
              <p className="display-font mt-2 text-2xl font-semibold">{money(snapshot?.netSalary ?? null)}</p>
            </article>
            <article className="soft-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.cnssCompliance")}</p>
              <p className="display-font mt-2 text-2xl font-semibold">
                {snapshot?.cnssCompliance === null ? "-" : snapshot?.cnssCompliance ? t("protectionPage.statusOk") : t("protectionPage.statusRisk")}
              </p>
            </article>
            <article className="soft-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.leaveAccruedTaken")}</p>
              <p className="display-font mt-2 text-2xl font-semibold">
                {snapshot?.leaveAccruedDays ?? "-"} / {snapshot?.leaveTakenDays ?? "-"}
              </p>
            </article>
            <article className="soft-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.indemnityToday")}</p>
              <p className="display-font mt-2 text-2xl font-semibold">{money(snapshot?.indemnityIfTerminatedToday ?? null)}</p>
            </article>
            <article className="soft-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.smigCompliance")}</p>
              <p className="display-font mt-2 text-2xl font-semibold">
                {snapshot?.smigCompliance === null ? "-" : snapshot?.smigCompliance ? t("protectionPage.statusOk") : t("protectionPage.statusRisk")}
              </p>
            </article>
            <article className="soft-card rounded-2xl p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.overtimeOwed")}</p>
              <p className="display-font mt-2 text-2xl font-semibold">{money(snapshot?.overtimeOwedEstimate ?? null)}</p>
            </article>
            <article className="soft-card rounded-2xl p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{t("protectionPage.updatedAt")}</p>
              <p className="mt-2 text-sm">{snapshot?.updatedAt ? new Date(snapshot.updatedAt).toLocaleString(locale) : "-"}</p>
            </article>
          </section>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/journal/violations" className="soft-card rounded-3xl p-5">
            <h2 className="display-font text-2xl font-semibold">{t("protectionPage.violationsTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{t("protectionPage.violationsDesc")}</p>
          </Link>
          <Link href="/journal/overtime" className="soft-card rounded-3xl p-5">
            <h2 className="display-font text-2xl font-semibold">{t("protectionPage.overtimeTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{t("protectionPage.overtimeDesc")}</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
