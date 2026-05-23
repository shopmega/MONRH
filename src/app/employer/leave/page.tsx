import type { Metadata } from "next";
import { EmployerLeaveClient } from "@/components/employer/employer-leave-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Conges & absences | ${SITE_NAME}`,
  description: "Suivi employeur des conges, absences, soldes acquis et validations RH.",
  robots: { index: false, follow: false },
};

export default function EmployerLeavePage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Suivi des conges & absences
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Validation patron & compteurs
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Enregistrez les demandes, suivez les soldes estimes et gardez une file claire pour approuver ou refuser les absences.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Base compteur
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">1,5 jour / mois</p>
            </div>
          </div>
        </header>

        <EmployerLeaveClient />
    </>
  );
}
