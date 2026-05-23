import type { Metadata } from "next";
import { EmployerCabinetClient } from "@/components/employer/employer-cabinet-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Cabinet RH | ${SITE_NAME}`,
  description: "Mode fiduciaire et cabinet RH pour gerer un portefeuille multi-entreprises.",
  robots: { index: false, follow: false },
};

export default function EmployerCabinetPage() {
  return (
    <>
        <header className="mb-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Mode fiduciaire / cabinet RH
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="display-font text-3xl font-black tracking-tight sm:text-4xl">
                Portefeuille multi-entreprises
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
                Suivez les clients, le statut paie/CNSS et les gates du plan Cabinet depuis un tableau consolide.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                Offre
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--heading)]">Cabinet RH</p>
            </div>
          </div>
        </header>

        <EmployerCabinetClient />
    </>
  );
}
