import type { Metadata } from "next";
import { EmployerReportsClient } from "@/components/employer/employer-reports-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Etats de paie | ${SITE_NAME}`,
  description: "Livre de paie, cotisations, caisse et etat de conges.",
  robots: { index: false, follow: false },
};

export default function EmployerReportsPage() {
  return (
    <>
      <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">Reporting paie</p>
        <h1 className="display-font mt-3 text-3xl font-black tracking-tight sm:text-4xl">Etats RH & paie</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Consultez le livre de paie, l'etat resume des cotisations, l'etat de caisse et l'etat de conges.
        </p>
      </header>
      <EmployerReportsClient />
    </>
  );
}
