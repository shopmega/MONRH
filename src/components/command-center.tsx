"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const filteredItems = TOOL_CATALOG.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      <div className="relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white bg-white/80 shadow-2xl shadow-black/20 backdrop-blur-2xl translate-y-0 animate-in fade-in slide-in-from-top-4 duration-300 sm:rounded-[2.5rem]">
        <div className="flex items-center gap-3 border-b border-[var(--juris-outline-variant)] p-4 sm:gap-4 sm:p-6">
          <svg className="w-6 h-6 text-[var(--juris-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Rechercher un outil, un sujet, un guide..."
            className="w-full bg-transparent border-none text-lg font-bold text-[var(--juris-on-surface)] focus:ring-0 placeholder:text-[var(--juris-on-surface-variant)] placeholder:opacity-40 sm:text-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="px-3 py-1 bg-[var(--juris-surface-low)] rounded-lg text-[10px] font-black opacity-40">ESC</div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {query.length > 0 ? (
            <div className="space-y-2">
              <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--juris-on-surface-variant)] opacity-40">Résultats suggérés</p>
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-4 rounded-2xl hover:bg-[var(--juris-primary-container)] group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--juris-surface-low)] flex items-center justify-center text-[var(--juris-on-surface-variant)] group-hover:bg-white group-hover:text-[var(--juris-primary)] transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--juris-on-surface)]">{item.label}</p>
                      <p className="text-xs text-[var(--juris-on-surface-variant)] opacity-60">Outil de simulation</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--juris-on-surface-variant)] opacity-40">Actions rapides</p>
                {[
                  { label: "Nouveau contrat", href: "/contrat" },
                  { label: "Historique audits", href: "/compte" },
                  { label: "Espace Litiges", href: "/litiges" }
                ].map(action => (
                  <button key={action.label} onClick={() => { router.push(action.href); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm font-bold text-[var(--juris-primary)] hover:underline">
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 border-t border-[var(--juris-outline-variant)] bg-[var(--juris-surface-low)] p-4 text-[10px] font-bold uppercase tracking-widest text-[var(--juris-on-surface-variant)] opacity-40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span>↑↓ Naviguer</span>
            <span>↵ Sélectionner</span>
          </div>
          <span>Digital Jurisconsult v3.0</span>
        </div>
      </div>
    </div>
  );
}
