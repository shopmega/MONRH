import type { Metadata } from "next";
import { EmployerAnalyticsClient } from "@/components/employer/employer-analytics-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Analytique RH | ${SITE_NAME}`,
  description: "Analytique employeur pour masse salariale, projection annuelle, absences et benchmarks RH.",
  robots: { index: false, follow: false },
};

export default function EmployerAnalyticsPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Analytique RH & masse salariale
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Couts, projection et signaux RH
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Suivez le cout employeur, le net distribue, les absences et les variations de masse salariale a partir
                des donnees du portail.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Source
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Paie + registre RH</p>
            </div>
          </div>
        </header>

        <EmployerAnalyticsClient />
    </>
  );
}
