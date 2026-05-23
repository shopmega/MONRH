import type { Metadata } from "next";
import { EmployeeRegisterClient } from "@/components/employer/employee-register-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Registre du personnel | ${SITE_NAME}`,
  description: "Registre employeur pour suivre salaries, contrats, anciennete, salaire brut et numero CNSS.",
  robots: { index: false, follow: false },
};

export default function EmployerEmployeesPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Registre du personnel
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Salaries & contrats
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Premier socle du portail employeur: centraliser les salaries, suivre les contrats actifs,
                preparer les bulletins de paie et fiabiliser les exports CNSS.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Mode actuel
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Registre actif</p>
            </div>
          </div>
        </header>

        <EmployeeRegisterClient />
    </>
  );
}
