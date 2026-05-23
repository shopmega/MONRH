import type { Metadata } from "next";
import { UserRoundCheck } from "lucide-react";
import { EmployeePortalClient } from "@/components/employee/employee-portal-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Self-service salarie | ${SITE_NAME}`,
  description: "Espace self-service salarie integre au module employeur.",
  robots: { index: false, follow: false },
};

export default function EmployerSelfServicePage() {
  return (
    <>
      <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
          <UserRoundCheck className="h-4 w-4" />
          Portail employe self-service
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
              Mes bulletins, conges et documents
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Apercu employeur du portail salarie pour les bulletins, documents RH et demandes d absence.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Acces
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--heading)]">Apercu employeur</p>
          </div>
        </div>
      </header>

      <EmployeePortalClient />
    </>
  );
}
