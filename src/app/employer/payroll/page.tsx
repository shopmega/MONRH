import type { Metadata } from "next";
import { EmployerPayrollClient } from "@/components/employer/employer-payroll-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Paie employeur | ${SITE_NAME}`,
  description: "Calcul de paie employeur par salarie: brut, retenues, net a payer et cout employeur.",
  robots: { index: false, follow: false },
};

export default function EmployerPayrollPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Generation de fiches de paie
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Paie mensuelle
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Selectionnez les salaries du registre, appliquez les variables du mois, puis calculez le
                brut, les retenues, le net a payer et le cout employeur.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Statut
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Calcul connecte au moteur paie</p>
            </div>
          </div>
        </header>

        <EmployerPayrollClient />
    </>
  );
}
