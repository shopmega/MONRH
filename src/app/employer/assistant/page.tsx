import type { Metadata } from "next";
import { EmployerAssistantClient } from "@/components/employer/employer-assistant-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Assistant RH | ${SITE_NAME}`,
  description: "Assistant employeur pour questions RH, droit du travail et actions de conformite.",
  robots: { index: false, follow: false },
};

export default function EmployerAssistantPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Assistant RH droit du travail
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Reponses RH contextualisees
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Analysez les questions recurrentes avec le registre, la paie, les absences et les alertes du portail
                employeur.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Statut
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Assistant contextuel</p>
            </div>
          </div>
        </header>

        <EmployerAssistantClient />
    </>
  );
}
