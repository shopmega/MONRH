import type { Metadata } from "next";
import { EmployerCnssClient } from "@/components/employer/employer-cnss-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Declarations employeur | ${SITE_NAME}`,
  description: "Centre de declarations employeur: controles mensuels CNSS, recap IR et preparation export.",
  robots: { index: false, follow: false },
};

export default function EmployerCnssPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Declarations employeur
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Centre de declarations
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Controlez la paie source, les donnees CNSS et le recap IR avant de preparer les fichiers
                mensuels utiles au depot.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Statut
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Preparation mensuelle</p>
            </div>
          </div>
        </header>

        <EmployerCnssClient />
    </>
  );
}
