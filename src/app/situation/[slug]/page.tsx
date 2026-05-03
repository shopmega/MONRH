"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { useMemo, useState } from "react";
import situationsData from "@/data/situations.json";

type SituationToolType = "calculator" | "document" | "tool" | "article";

type SituationTool = {
  type: SituationToolType;
  title: { fr: string; ar: string };
  description: { fr: string; ar: string };
  href: string;
  category: string;
};

type SituationHub = {
  slug: string;
  title: { fr: string; ar: string };
  kicker: { fr: string; ar: string };
  description: { fr: string; ar: string };
  featuredLabel: { fr: string; ar: string };
  featuredHref: string;
  featuredDescription: { fr: string; ar: string };
  tools: SituationTool[];
};

const SITUATION_HUBS: Record<string, SituationHub> = situationsData as Record<string, SituationHub>;

export default function SituationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const copy = language === "ar" ? "ar" : "fr" as "fr" | "ar";
  const resolvedParams = React.use(params);

  const hub = useMemo(() => {
    if (!resolvedParams?.slug) return null;
    const hubKey = resolvedParams.slug as keyof typeof SITUATION_HUBS;
    return SITUATION_HUBS[hubKey];
  }, [resolvedParams?.slug]);

  if (!hub) {
    return (
      <main className="paper-bg min-h-screen">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
          <section className="soft-card rounded-[2rem] p-6 sm:p-8">
            <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
              {language === "ar" ? "الصفحة غير موجودة" : "Page non trouvée"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)]">
              {language === "ar" ? "الموقف المطلوب غير موجود" : "La situation demandée n'existe pas"}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const filteredTools = useMemo(() => {
    if (!hub || !searchQuery.trim()) return hub?.tools || [];
    
    const query = searchQuery.toLowerCase();
    return hub.tools
      .filter((tool) => 
        tool.title[copy as 'fr' | 'ar'].toLowerCase().includes(query) ||
        tool.description[copy as 'fr' | 'ar'].toLowerCase().includes(query)
      );
  }, [hub?.tools, searchQuery]);

  const visibleTools = filteredTools;

  return (
    <main className="paper-bg min-h-screen">
      <BreadcrumbJsonLd items={[{ name: hub.title[copy], href: `/situation/${hub.slug}` }]} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">{hub.kicker[copy]}</p>
          <h1 className="display-font mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
            {hub.title[copy]}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {hub.description[copy]}
          </p>
          <div className="mt-5">
            <Link href={hub.featuredHref} className="btn-primary px-5 py-3 text-sm">
              {hub.featuredLabel[copy]}
            </Link>
            <p className="mt-3 max-w-2xl text-sm text-[var(--ink-soft)]">{hub.featuredDescription[copy]}</p>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-6">
            <input
              type="text"
              placeholder={copy === "ar" ? "ابحث في الأدوات..." : "Rechercher un outil..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--line)] bg-[var(--background)] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((tool, index) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`rounded-3xl p-5 transition hover:-translate-y-0.5 ${
                  index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">
                    {tool.type === "calculator" && "🧮"}
                    {tool.type === "document" && "📄"}
                    {tool.type === "tool" && "🔧"}
                    {tool.type === "article" && "📖"}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-2">{tool.title[copy]}</h3>
                    <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{tool.description[copy]}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">
                  {copy === "ar" ? "افتح" : "Ouvrir"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
