"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useMemo } from "react";
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

export function SituationNav() {
  const { language } = useLanguage();
  const copy = language === "ar" ? "ar" : "fr";

  return (
    <nav className="hidden lg:flex space-x-8">
      {Object.entries(SITUATION_HUBS).map(([key, hub]) => (
        <div key={key} className="relative group">
          <Link
            href={`/situation/${hub.slug}`}
            className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
          >
            {hub.title[copy]}
          </Link>
          
          <div className="absolute left-0 top-full mt-2 w-screen max-w-4xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="soft-card rounded-lg shadow-xl p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Link
                    href={hub.featuredHref}
                    className="block group rounded-lg p-4 hover:bg-[var(--highlight)] transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--accent)]">
                      {hub.featuredLabel[copy]}
                    </h3>
                    <p className="text-sm text-[var(--ink-soft)] mb-3">
                      {hub.featuredDescription[copy]}
                    </p>
                    <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wide">
                      {copy === "ar" ? "افتح الأداة" : "Ouvrir l'outil"}
                    </span>
                  </Link>
                </div>

                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hub.tools.map((tool, index) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className={`rounded-lg p-3 transition hover:-translate-y-0.5 ${
                          index % 2 === 0 ? "soft-card" : "panel-strong border border-[var(--line)]"
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <span className="text-lg">
                            {tool.type === "calculator" && "🧮"}
                            {tool.type === "document" && "📄"}
                            {tool.type === "tool" && "🔧"}
                            {tool.type === "article" && "📖"}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">
                              {tool.title[copy]}
                            </h4>
                            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                              {tool.description[copy]}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[var(--accent)]">
                          {copy === "ar" ? "افتح" : "Ouvrir"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </nav>
  );
}
