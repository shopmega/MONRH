import type { Metadata } from "next";
import { EmployerComplianceClient } from "@/components/employer/employer-compliance-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Alertes conformite | ${SITE_NAME}`,
  description: "Alertes employeur pour CDD, CNSS, documents RH, SMIG et validation paie.",
  robots: { index: false, follow: false },
};

export default function EmployerCompliancePage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Alertes & rappels de conformite
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Controle RH mensuel
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Centralisez les alertes qui bloquent une paie propre: contrats a completer, pieces RH manquantes,
                CNSS a verifier, salaire sous reference SMIG et demandes d absence en attente.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Source
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Registre employeur</p>
            </div>
          </div>
        </header>

        <EmployerComplianceClient />
    </>
  );
}
