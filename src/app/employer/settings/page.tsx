import type { Metadata } from "next";
import { EmployerSettingsClient } from "@/components/employer/employer-settings-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Parametres employeur | ${SITE_NAME}`,
  description: "Configuration multi-entreprise, plan, modules et livrables de la suite employeur.",
  robots: { index: false, follow: false },
};

export default function EmployerSettingsPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Suite employeur
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Entreprises, plan & livrables
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Configurez le contexte employeur, le plan actif et les livrables disponibles pour les
                modules exports, bulletins et mode multi-entreprise.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Statut
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Configuration active</p>
            </div>
          </div>
        </header>

        <EmployerSettingsClient />
    </>
  );
}
