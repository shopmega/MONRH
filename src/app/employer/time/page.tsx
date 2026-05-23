import type { Metadata } from "next";
import { EmployerTimeClient } from "@/components/employer/employer-time-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Pointage & heures supplementaires | ${SITE_NAME}`,
  description: "Saisie employeur des heures hebdomadaires, calcul des majorations et validation avant paie.",
  robots: { index: false, follow: false },
};

export default function EmployerTimePage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Pointage & heures supplementaires
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Saisie hebdomadaire & validation
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Enregistrez les heures normales, les heures supplementaires de jour, nuit, repos ou ferie, puis validez le montant a integrer dans la paie.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Calcul
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Moteur heures sup MONRH</p>
            </div>
          </div>
        </header>

        <EmployerTimeClient />
    </>
  );
}
