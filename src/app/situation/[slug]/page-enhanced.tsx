"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { usePublicConfig } from "@/components/public-config-provider";
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

// Enhanced tool icons
const ToolIcon = ({ type, className }: { type: SituationToolType; className: string }) => {
  const icons = {
    calculator: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
    document: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    tool: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    article: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  };

  return icons[type] || icons.calculator;
};

// Enhanced tool card component
const ToolCard = ({ tool, isActive, language }: { tool: SituationTool; isActive: boolean; language: 'fr' | 'ar' }) => {
  const colors = {
    calculator: "from-blue-500 to-blue-600",
    document: "from-green-500 to-green-600",
    tool: "from-purple-500 to-purple-600",
    article: "from-orange-500 to-orange-600",
  };

  const bgColors = {
    calculator: "bg-blue-50 border-blue-200",
    document: "bg-green-50 border-green-200",
    tool: "bg-purple-50 border-purple-200",
    article: "bg-orange-50 border-orange-200",
  };

  return (
    <Link
      href={tool.href}
      className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        isActive ? 'ring-2 ring-[var(--accent)] ring-offset-2' : ''
      } ${bgColors[tool.type]}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[tool.type]} shadow-lg`}>
            <ToolIcon type={tool.type} className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-white/80 text-gray-700`}>
              {tool.type === 'calculator' && 'Calculateur'}
              {tool.type === 'document' && 'Document'}
              {tool.type === 'tool' && 'Outil'}
              {tool.type === 'article' && 'Article'}
            </span>
          </div>
        </div>
        
        <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-[var(--accent)] transition-colors">
          {tool.title[language]}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {tool.description[language]}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--accent)]">
            {language === 'ar' ? 'Ouvrir' : 'Ouvrir'}
          </span>
          <div className="p-2 rounded-lg bg-white/80 group-hover:bg-[var(--accent)] transition-colors">
            <svg className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[tool.type]} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}></div>
    </Link>
  );
};

// Enhanced search component
const SearchBar = ({ value, onChange, language }: { value: string; onChange: (value: string) => void; language: 'fr' | 'ar' }) => {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={language === 'ar' ? 'Rechercher un outil...' : 'Rechercher un outil...'}
        className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200 shadow-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function SituationPageEnhanced({ params }: { params: Promise<{ slug: string }> }) {
  const { language } = useLanguage();
  const { config } = usePublicConfig();
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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="mb-8">
                <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {language === "ar" ? "Page non trouvée" : "Page non trouvée"}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {language === "ar" ? "La situation demandée n'existe pas" : "La situation demandée n'existe pas"}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 transition-colors"
              >
                {language === "ar" ? "Retour à l'accueil" : "Retour à l'accueil"}
              </Link>
            </div>
          </div>
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

  const toolCounts = useMemo(() => {
    const counts = {
      calculator: 0,
      document: 0,
      tool: 0,
      article: 0,
    };
    
    hub.tools.forEach(tool => {
      counts[tool.type]++;
    });
    
    return counts;
  }, [hub.tools]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-blue-600/10"></div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-sm font-semibold mb-6">
              {hub.kicker[copy]}
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {hub.title[copy]}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {hub.description[copy]}
            </p>
            
            {/* Featured Tool */}
            <Link
              href={hub.featuredHref}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {hub.featuredLabel[copy]}
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              {hub.featuredDescription[copy]}
            </p>
          </div>

          {/* Tool Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{toolCounts.calculator}</div>
              <div className="text-sm text-gray-600">Calculateurs</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">{toolCounts.document}</div>
              <div className="text-sm text-gray-600">Documents</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{toolCounts.tool}</div>
              <div className="text-sm text-gray-600">Outils</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{toolCounts.article}</div>
              <div className="text-sm text-gray-600">Articles</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <SearchBar value={searchQuery} onChange={setSearchQuery} language={copy} />
          </div>

          {/* Tools Grid */}
          <div className="mb-12">
            {filteredTools.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'ar' ? 'Aucun outil trouvé' : 'Aucun outil trouvé'}
                </h3>
                <p className="text-gray-600">
                  {language === 'ar' ? 'Essayez de modifier votre recherche' : 'Essayez de modifier votre recherche'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.href}
                    tool={tool}
                    isActive={false}
                    language={copy}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
