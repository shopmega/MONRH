"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";

type ConflictType = "salary" | "harassment" | "discipline" | "other";

export default function ConflictWizardPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ConflictType>();
  const [severity, setSeverity] = useState<number>(0);

  return (
    <main className="min-h-screen bg-[var(--juris-surface)] selection:bg-[var(--juris-primary-container)] selection:text-white pt-20 pb-32">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-atmos pointer-events-none opacity-30" />

      <div className="mx-auto max-w-4xl px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full bg-[var(--juris-surface-container)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--juris-primary)] mb-6">
            Assistant de Résolution
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight text-[var(--juris-on-surface)] font-display leading-[0.95] mb-6">
            Évaluez votre situation <br/>en 3 étapes.
          </h1>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-[var(--juris-primary)]' : 'w-4 bg-[var(--juris-outline-variant)]'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-juris-primary/10 border border-white">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-[var(--juris-on-surface)] font-display mb-8 text-center">Quel est la nature du conflit ?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: "salary", label: "Salaires Impayés", desc: "Retards, primes ou heures supp non réglées." },
                  { id: "harassment", label: "Harcèlement / Pression", desc: "Pressions morales ou environnement toxique." },
                  { id: "discipline", label: "Procédure Disciplinaire", desc: "Mise à pied, blâme ou entretien préalable." },
                  { id: "other", label: "Autre Différend", desc: "Conditions de travail, congés ou contrats." }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setType(item.id as ConflictType); setStep(2); }}
                    className="flex flex-col p-8 rounded-[2.5rem] bg-[var(--juris-surface-low)] hover:bg-[var(--juris-primary-container)] transition-all group text-left border border-transparent hover:border-[var(--juris-primary)]"
                  >
                    <span className="text-xl font-bold text-[var(--juris-on-surface)] mb-2 group-hover:text-[var(--juris-primary)] transition-colors">{item.label}</span>
                    <span className="text-sm text-[var(--juris-on-surface-variant)] opacity-60 font-medium">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setStep(1)} className="text-[10px] font-bold text-[var(--juris-primary)] uppercase tracking-widest mb-10 block">← Retour</button>
              <h2 className="text-3xl font-extrabold text-[var(--juris-on-surface)] font-display mb-8">Niveau de gravité perçu</h2>
              <p className="text-base text-[var(--juris-on-surface-variant)] mb-12 font-medium">L'impact sur votre santé ou votre carrière est-il immédiat ?</p>
              
              <div className="space-y-6">
                {[
                  { val: 1, label: "Modéré", desc: "Un simple rappel ou une clarification pourrait suffire." },
                  { val: 2, label: "Sérieux", desc: "Plusieurs relances sans succès, climat tendu." },
                  { val: 3, label: "Critique", desc: "Risque de perte d'emploi ou impact santé physique/mentale." }
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => { setSeverity(s.val); setStep(3); }}
                    className="w-full flex items-center justify-between p-8 rounded-[2rem] bg-[var(--juris-surface-low)] hover:bg-white hover:shadow-xl transition-all group border border-transparent hover:border-[var(--juris-primary)]/20"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xl font-bold text-[var(--juris-on-surface)]">{s.label}</span>
                      <span className="text-sm text-[var(--juris-on-surface-variant)] font-medium opacity-60">{s.desc}</span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all ${s.val === 1 ? 'bg-amber-400' : s.val === 2 ? 'bg-orange-500' : 'bg-red-600'}`}>
                      {s.val}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
              <div className="w-20 h-20 bg-[var(--juris-primary-container)] text-[var(--juris-primary)] rounded-[2rem] flex items-center justify-center mx-auto mb-10">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-extrabold text-[var(--juris-on-surface)] font-display mb-6">Diagnostic Terminé</h2>
              <p className="text-xl text-[var(--juris-on-surface-variant)] mb-12 font-medium px-8 leading-relaxed">
                Votre cas nécessite une intervention de <span className="text-[var(--juris-primary)]">{severity === 3 ? "Haute Priorité" : "Niveau Intermédiaire"}</span>. Nous recommandons de générer une **Mise en Demeure** formelle.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/modeles" className="btn-primary h-14 px-10 flex items-center justify-center text-sm font-bold uppercase tracking-widest">
                  Générer le Document
                </Link>
                <Link href="/compte" className="h-14 px-10 flex items-center justify-center rounded-2xl bg-[var(--juris-surface-low)] text-[var(--juris-on-surface)] font-bold text-sm uppercase tracking-widest">
                  Sauvegarder le dossier
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
