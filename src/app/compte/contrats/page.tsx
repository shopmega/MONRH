"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type ContractItem = {
  id: string;
  createdAt: string;
  templateId: string;
  templateTitle: string;
  contractType: string;
  contractData: any;
};

export default function ContratsHistoryPage() {
  const { t, locale } = useLanguage();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/contracts/user");
        const data = await res.json();
        if (res.ok && data.ok) {
          setContracts(data.items);
        }
      } catch (error) {
        console.error("Failed to load contracts:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <header className="mb-8">
          <Link 
            href="/compte" 
            className="group inline-flex items-center text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour au compte
          </Link>
          <div className="mt-4">
            <h1 className="display-font text-4xl font-semibold leading-tight sm:text-5xl">
              Mes Contrats
            </h1>
            <p className="mt-2 text-[var(--ink-soft)] max-w-2xl">
              Retrouvez ici tous les contrats que vous avez générés sur SIMPAIE. Vous pouvez les consulter à nouveau ou les télécharger.
            </p>
          </div>
        </header>

        <section className="grid gap-4">
          {loading ? (
            <div className="soft-card animate-pulse rounded-2xl p-8 text-center text-[var(--ink-soft)]">
              Chargement de votre historique...
            </div>
          ) : contracts.length === 0 ? (
            <div className="soft-card rounded-3xl p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-muted)]">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-[var(--ink-soft)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Aucun contrat généré</h2>
              <p className="mt-2 text-[var(--ink-soft)]">Vous n'avez pas encore utilisé notre générateur de contrat premium.</p>
              <Link href="/contrat" className="btn-primary mt-6 inline-flex px-8 py-3">
                Générer mon premier contrat
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contracts.map((contract) => (
                <article key={contract.id} className="soft-card group relative flex flex-col rounded-[2rem] border border-[var(--line)]/50 p-6 transition-all hover:border-[var(--accent)]/30 hover:shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      contract.contractType === 'CDI' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {contract.contractType}
                    </span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {formatDate(contract.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug group-hover:text-[var(--accent)] transition-colors">
                    {contract.templateTitle}
                  </h3>
                  
                  <div className="mt-4 flex-grow space-y-2 text-sm text-[var(--ink-soft)]">
                    <div className="flex items-center gap-2">
                       <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" /></svg>
                       <span className="line-clamp-1">{contract.contractData?.employee_name || 'Salarié non spécifié'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7l9-4 9 4v10H3V7z" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /></svg>
                       <span className="line-clamp-1">{contract.contractData?.company_name || 'Entreprise non spécifiée'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link 
                      href={`/contrat/preview?id=${contract.id}`} 
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-xs font-bold transition hover:bg-[var(--line)]"
                    >
                      Consulter
                    </Link>
                    <Link 
                      href={`/contrat/preview?id=${contract.id}&download=true`} 
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                    >
                      Télécharger
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
