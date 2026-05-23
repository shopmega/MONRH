import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { ContractPageClient } from "@/components/contracts/contract-page-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Contrats employeur | ${SITE_NAME}`,
  description: "Generation de contrats CDI et CDD depuis le portail employeur MONRH.",
  robots: { index: false, follow: false },
};

export default function EmployerContractsPage() {
  return (
    <>
      <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
          <BriefcaseBusiness className="h-4 w-4" />
          Contrats employeur
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
              Generation CDI / CDD
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Preparez un contrat depuis le registre employeur, controlez les champs obligatoires et conservez un brouillon par entreprise.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Cadre
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--heading)]">CDI + CDD</p>
          </div>
        </div>
      </header>

      <ContractPageClient embedded />
    </>
  );
}
