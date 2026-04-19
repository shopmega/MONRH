"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

const TOOL_ICONS: Record<string, string> = {
  salary: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  cnss: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  contrat: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  overtime: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  leave: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  career: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  departure: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  document: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  default: "M13 10V3L4 14h7v7l9-11h-7z",
};

const PRIMARY_TOOLS = [
  {
    id: "salaire",
    icon: "salary",
    category: "Salaire",
    title: "Simulateur de Salaire Net et Brut",
    desc: "Calculez les cotisations CNSS, AMO et IR en quelques secondes.",
    href: "/salaire",
    cta: "Calculer",
    featured: true,
  },
  {
    id: "cnss",
    icon: "cnss",
    category: "Cotisations",
    title: "Calculateur CNSS",
    desc: "Estimez cotisations, droits et impact employeur/salarie.",
    href: "/simulateurs/pension-cnss",
    cta: "Calculer",
  },
  {
    id: "conges",
    icon: "leave",
    category: "Conges",
    title: "Calculateur de Conges",
    desc: "Droits conges payes, jours feries et solde de tout compte.",
    href: "/conges-cnss",
    cta: "Calculer",
  },
  {
    id: "career",
    icon: "career",
    category: "Carriere",
    title: "Simulateurs de Carriere",
    desc: "Comparez les scenarios d'evolution salariale et professionnelle.",
    href: "/carriere",
    cta: "Explorer",
  },
];

const ADDITIONAL_TOOLS = [
  { id: "heures-sup", title: "Heures Sup.", href: "/simulateurs/heures-supplementaires", icon: "overtime", kind: "salaire" },
  { id: "licenciement", title: "Indemnite", href: "/simulateurs/licenciement", icon: "departure", kind: "contrats" },
  { id: "contrat-depart", title: "Depart", href: "/contrat-depart", icon: "departure", kind: "contrats" },
  { id: "modeles", title: "Modeles", href: "/modeles", icon: "document", kind: "contrats" },
  { id: "contrat", title: "Contrat", href: "/contrat", icon: "contrat", kind: "contrats" },
  { id: "litiges", title: "Litiges", href: "/litiges", icon: "default", kind: "litiges" },
];

type FilterId = "all" | "salaire" | "conges" | "contrats" | "litiges";

function matchesFilter(href: string, filter: FilterId) {
  if (filter === "all") return true;
  if (filter === "salaire") return href.includes("/salaire") || href.includes("/simulateurs/");
  if (filter === "conges") return href.includes("/conges");
  if (filter === "contrats") return href.includes("/contrat") || href.includes("/modeles");
  if (filter === "litiges") return href.includes("/litiges");
  return true;
}

export default function ToolsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const filters: Array<{ id: FilterId; label: string }> = [
    { id: "all", label: "Tout" },
    { id: "salaire", label: "Salaire" },
    { id: "conges", label: "Conges" },
    { id: "contrats", label: "Contrats" },
    { id: "litiges", label: "Litiges" },
  ];

  const featured = PRIMARY_TOOLS[0];
  const filteredPrimary = useMemo(
    () => PRIMARY_TOOLS.slice(1).filter((tool) => matchesFilter(tool.href, activeFilter)),
    [activeFilter],
  );
  const filteredAdditional = useMemo(
    () => ADDITIONAL_TOOLS.filter((tool) => activeFilter === "all" || tool.kind === activeFilter),
    [activeFilter],
  );

  const protectionTools = TOOL_CATALOG.filter((tool) => tool.kind === "protection").slice(0, 3);
  const quickStats = [
    { label: "Simulateurs", value: TOOL_CATALOG.filter((tool) => tool.kind === "simulator").length },
    { label: "Outils Protection", value: TOOL_CATALOG.filter((tool) => tool.kind === "protection").length },
    { label: "Modeles Lies", value: 12 },
  ];

  return (
    <main className="paper-bg min-h-screen max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">Jurisconsult</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            La Boite a Outils
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)]">
            Accedez aux simulateurs, audits de conformite et generateurs utiles pour prendre les bonnes decisions RH.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {quickStats.map((stat) => (
              <article key={stat.label} className="panel-strong rounded-2xl p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">{stat.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeFilter === f.id
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-muted)] text-[var(--ink-soft)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </section>

        {matchesFilter(featured.href, activeFilter) ? (
          <section className="mt-4">
            <Link href={featured.href} className="block">
              <article className="relative overflow-hidden rounded-[2rem] bg-[var(--accent)] p-6 text-white">
                <div
                  className="absolute inset-0 opacity-15"
                  style={{ backgroundImage: "radial-gradient(circle at 75% 20%, #fff 0%, transparent 58%)" }}
                />
                <div className="relative">
                  <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Outil Vedette
                  </span>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight">{featured.title}</h2>
                  <p className="mt-2 max-w-xl text-sm text-white/80">{featured.desc}</p>
                  <span className="mt-5 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-[var(--accent)]">
                    {featured.cta} {"->"}
                  </span>
                </div>
              </article>
            </Link>
          </section>
        ) : null}

        {filteredPrimary.length > 0 ? (
          <section className="mt-4 grid gap-3">
            {filteredPrimary.map((tool) => (
              <Link key={tool.id} href={tool.href} className="block">
                <article className="soft-card rounded-3xl p-5 transition hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                      <svg className="h-5 w-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={TOOL_ICONS[tool.icon] ?? TOOL_ICONS.default} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{tool.category}</p>
                      <h3 className="mt-1 text-lg font-semibold leading-snug text-[var(--foreground)]">{tool.title}</h3>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">{tool.desc}</p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
                      {tool.cta} {"->"}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        ) : null}

        {filteredAdditional.length > 0 ? (
          <section className="mt-5">
            <h2 className="section-kicker">Acces Rapides</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredAdditional.map((tool) => (
                <Link key={tool.id} href={tool.href}>
                  <article className="soft-card rounded-2xl p-4 text-center transition hover:-translate-y-0.5">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                      <svg className="h-5 w-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={TOOL_ICONS[tool.icon] ?? TOOL_ICONS.default} />
                      </svg>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[var(--foreground)]">{tool.title}</p>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-5">
          <h2 className="section-kicker">Protection Juridique</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {protectionTools.map((tool) => (
              <Link key={tool.id} href={tool.href}>
                <article className="panel-strong rounded-2xl p-4 transition hover:-translate-y-0.5">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{tool.label}</p>
                  <p className="mt-2 text-xs text-[var(--ink-soft)]">Outil d'analyse et controle rapide</p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/simulateurs", label: "Simulateurs", desc: "Tous les calculs RH" },
            { href: "/planifier", label: "Planification", desc: "Plan de carriere et budget" },
            { href: "/documents", label: "Documents", desc: "Modeles et lettres juridiques" },
          ].map((nav) => (
            <Link key={nav.href} href={nav.href}>
              <article className="soft-card rounded-2xl p-4 transition hover:-translate-y-0.5">
                <p className="text-sm font-semibold text-[var(--foreground)]">{nav.label}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{nav.desc}</p>
              </article>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
