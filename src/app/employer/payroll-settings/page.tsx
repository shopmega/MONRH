import type { Metadata } from "next";
import { EmployerPayrollSettingsClient } from "@/components/employer/employer-payroll-settings-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Parametres paie | ${SITE_NAME}`,
  description: "Rubriques, defaults et bases de paie employeur.",
  robots: { index: false, follow: false },
};

export default function EmployerPayrollSettingsPage() {
  return (
    <>
      <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Administration paie</p>
        <h1 className="display-font mt-3 text-3xl font-black tracking-tight sm:text-4xl">Parametres de paie</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Configurez les rubriques de primes, avantages en nature, indemnites et defaults de calcul mensuel.
        </p>
      </header>
      <EmployerPayrollSettingsClient />
    </>
  );
}
