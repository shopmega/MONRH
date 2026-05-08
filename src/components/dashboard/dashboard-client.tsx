"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { 
  Calculator, 
  FileText, 
  History, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  Briefcase,
  Star,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { localizeCalculatorTitle } from "@/lib/i18n/simulator-localization";
import { calculatorTypeToPath } from "@/lib/simulations/calculator-path";

type AvisHistory = {
  jobOffers: Array<{ id: string; company_name: string; job_title: string; status: string; created_at: string }>;
  reviews: Array<{ id: string; business_id: string; rating: number; comment: string; created_at: string }>;
  stats: { jobCount: number; reviewCount: number };
};

type MonRHActivity = {
  simulations: any[];
  documents: any[];
};

export function DashboardClient() {
  const { t, locale, language } = useLanguage();
  const [avisData, setAvisData] = useState<AvisHistory | null>(null);
  const [monRHData, setMonRHData] = useState<MonRHActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [avisRes, simRes, docRes] = await Promise.all([
          fetch("/api/avisine/user-history"),
          fetch("/api/simulations"),
          fetch("/api/documents/generated")
        ]);

        const [avis, sims, docs] = await Promise.all([
          avisRes.json(),
          simRes.json(),
          docRes.json()
        ]);

        setAvisData(avis);
        setMonRHData({
          simulations: sims.items || [],
          documents: docs.items || []
        });
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalActions = useMemo(() => {
    if (!monRHData || !avisData) return 0;
    return (monRHData.simulations.length + monRHData.documents.length + avisData.stats.jobCount + avisData.stats.reviewCount);
  }, [monRHData, avisData]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stat Ring */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card rounded-3xl p-6 bg-gradient-to-br from-[var(--surface-elevated)] to-transparent border border-[var(--line)]">
          <div className="flex items-center gap-3 text-[var(--accent)]">
            <Calculator className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">Simulations</span>
          </div>
          <p className="mt-4 text-4xl font-black">{monRHData?.simulations.length || 0}</p>
        </div>
        <div className="soft-card rounded-3xl p-6 bg-gradient-to-br from-[var(--surface-elevated)] to-transparent border border-[var(--line)]">
          <div className="flex items-center gap-3 text-emerald-500">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">Documents</span>
          </div>
          <p className="mt-4 text-4xl font-black">{monRHData?.documents.length || 0}</p>
        </div>
        <div className="soft-card rounded-3xl p-6 bg-slate-900 text-white border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 text-amber-400">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Analyses Avisine</span>
          </div>
          <p className="mt-4 text-4xl font-black">{avisData?.stats.jobCount || 0}</p>
          <p className="mt-1 text-[10px] text-slate-400 italic">Market Intelligence active</p>
        </div>
        <div className="soft-card rounded-3xl p-6 bg-gradient-to-br from-[var(--surface-elevated)] to-transparent border border-[var(--line)]">
          <div className="flex items-center gap-3 text-blue-500">
            <Star className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">Avis Publiés</span>
          </div>
          <p className="mt-4 text-4xl font-black">{avisData?.stats.reviewCount || 0}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Col: Market Intelligence (Avisine) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="display-font text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
              Intelligence Marché
            </h2>
            <Link href="https://avisine.com" className="text-xs font-bold flex items-center gap-1 text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">
              Gérer sur Avisine <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="soft-card rounded-[2.5rem] p-6 border-2 border-[var(--accent-soft)]/30">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 opacity-60">Derniers Scans d'offres</h3>
            <div className="space-y-4">
              {avisData?.jobOffers.length === 0 ? (
                <div className="rounded-2xl bg-[var(--surface-muted)] p-8 text-center text-sm text-[var(--ink-soft)]">
                  <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  Vous n'avez pas encore analysé d'offre.
                  <Link href="https://avisine.com/job-offers" className="block mt-4 text-[var(--accent)] font-bold decoration-2 underline-offset-4 hover:underline">
                    Scanner ma première offre →
                  </Link>
                </div>
              ) : (
                avisData?.jobOffers.map((offer) => (
                  <div key={offer.id} className="group relative rounded-2xl bg-white p-4 hover:shadow-md transition-all border border-[var(--line)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 line-clamp-1">{offer.job_title}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{offer.company_name}</p>
                      </div>
                      <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md tracking-tighter ${
                        offer.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                    <Link href={`https://avisine.com/job-offers/${offer.id}`} className="absolute inset-0 z-10" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Col: Calculations & Documents */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="display-font text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-[var(--accent)]" />
              Activités Récentes
            </h2>
          </div>

          <div className="soft-card rounded-[2.5rem] p-6 border border-[var(--line)]">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 opacity-60">Outils & Simulations</h3>
            <div className="space-y-4">
              {monRHData?.simulations.length === 0 ? (
                <div className="rounded-2xl bg-[var(--surface-muted)] p-8 text-center text-sm text-[var(--ink-soft)]">
                  Aucune activité récente sur SIMPAIE.
                </div>
              ) : (
                monRHData?.simulations.slice(0, 5).map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--line)] hover:border-[var(--accent-soft)] transition-colors">
                    <div>
                      <p className="font-bold text-sm">
                        {localizeCalculatorTitle(sim.calculatorType, sim.calculatorType, language)}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)] mt-1 opacity-70">
                        {new Date(sim.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <Link 
                      href={`${calculatorTypeToPath(sim.calculatorType)}/result?simulationId=${sim.id}`}
                      className="p-2 rounded-xl bg-white border border-[var(--line)] shadow-sm hover:text-[var(--accent)] transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Pro Tip Banner */}
      <div className="rounded-[2.5rem] bg-[var(--accent)] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 backdrop-blur-sm">
            <AlertCircle className="h-3 w-3" /> Ecosystem Tip
          </div>
          <h3 className="text-3xl font-black leading-tight tracking-tight">Boostez votre dossier</h3>
          <p className="mt-2 text-white/80 text-sm leading-relaxed">
            Joignez une analyse d'offre Avisine à votre dossier de licenciement ou de négociation pour prouver les benchmarks du marché. 
            <strong> 85% des négociations aboutissent avec des données comparatives.</strong>
          </p>
          <button className="mt-6 flex items-center gap-2 bg-white text-[var(--accent)] px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
            Explorer les outils <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute right-[-10%] top-[-20%] opacity-10 group-hover:rotate-12 transition-transform duration-1000">
          <Calculator className="h-64 w-64" />
        </div>
      </div>
    </div>
  );
}
