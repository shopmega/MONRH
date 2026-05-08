"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";

type NavKey = "home" | "salaire" | "carriere" | "depart" | "bibliotheque" | "modeles" | "account";

type NavItem = {
  key: NavKey;
  href: string;
  icon: string;
  label: { fr: string; ar: string };
};

const NAV_ITEMS: NavItem[] = [
  { 
    key: "home", 
    href: "/", 
    icon: "home",
    label: { fr: "Accueil", ar: "الرئيسية" },
  },
  { 
    key: "salaire", 
    href: "/situation/mon-salaire", 
    icon: "wallet",
    label: { fr: "Mon Salaire", ar: "أجري" },
  },
  { 
    key: "carriere", 
    href: "/situation/ma-carriere", 
    icon: "trending-up",
    label: { fr: "Ma Carrière", ar: "مساري المهني" },
  },
  { 
    key: "depart", 
    href: "/situation/depart-rupture", 
    icon: "log-out",
    label: { fr: "Départ", ar: "المغادرة" },
  },
  { 
    key: "bibliotheque", 
    href: "/bibliotheque", 
    icon: "book-open",
    label: { fr: "Bibliothèque", ar: "المكتبة" },
  },
  { 
    key: "modeles", 
    href: "/modeles", 
    icon: "file-text",
    label: { fr: "Modèles", ar: "نماذج" },
  },
  { 
    key: "account", 
    href: "/compte", 
    icon: "user",
    label: { fr: "Mon Compte", ar: "حسابي" },
  },
];

const ARABIC_NAV_LABELS: Record<NavKey, string> = {
  home: "الرئيسية",
  salaire: "أجري",
  carriere: "مساري المهني",
  depart: "المغادرة",
  bibliotheque: "المكتبة",
  modeles: "نماذج",
  account: "حسابي",
};

const MOBILE_NAV_SECTIONS = [
  {
    key: "simulateurs",
    href: "/simulateurs",
    icon: "calculator",
    label: { fr: "Simulateurs", ar: "Simulateurs" },
  },
  {
    key: "outils",
    href: "/outils",
    icon: "shield",
    label: { fr: "Outils", ar: "Outils" },
  },
] as const;

function normalizePublicPath(path: string): string {
  return path
    .replace(/^\/simulateurs(?=\/|$)/, "/simulate")
    .replace(/^\/outils(?=\/|$)/, "/tools");
}

function isActive(pathname: string, href: string): boolean {
  const normalizedPathname = normalizePublicPath(pathname);
  const normalizedHref = normalizePublicPath(href);

  if (normalizedHref === "/") return normalizedPathname === "/";
  return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
}

function BrandMark() {
  return (
    <svg
      className="h-7 w-7 text-[var(--juris-on-primary)]"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 50h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 15v35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 22h28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 22l-7 17h14l-7-17Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 22l-7 17h14l-7-17Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M25 50h14" stroke="var(--juris-primary-container)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// Enhanced icon components
const CustomIcon = ({ icon, className }: { icon: string; className: string }) => {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    wallet: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="8" cy="15" r="1" />
        <circle cx="16" cy="15" r="1" />
      </svg>
    ),
    "trending-up": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    "log-out": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    "book-open": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    "file-text": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    user: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    calculator: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="9" y2="11" />
        <line x1="12" y1="11" x2="13" y2="11" />
        <line x1="16" y1="11" x2="17" y2="11" />
        <line x1="8" y1="15" x2="9" y2="15" />
        <line x1="12" y1="15" x2="13" y2="15" />
        <line x1="16" y1="15" x2="17" y2="15" />
      </svg>
    ),
    shield: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  };

  return icons[icon] || icons.home;
};

export function SiteNav() {
  const { language } = useLanguage();
  const [openMenu, setOpenMenu] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (openMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openMenu]);

  const toggleMenu = useCallback(() => {
    setOpenMenu(!openMenu);
  }, [openMenu]);

  const closeMenu = useCallback(() => {
    setOpenMenu(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeMenu]);



  return (
    <>
      <div className="fixed top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--background)]/80 backdrop-blur-xl transition-all duration-300 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 overflow-x-hidden">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--juris-primary)] shadow-lg shadow-juris-primary/20 transition-transform group-hover:rotate-6">
                <BrandMark />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-[var(--juris-on-surface)] font-display tracking-tight leading-none group-hover:text-[var(--juris-primary)] transition-colors">
                  SIMPAIE
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--juris-on-surface-variant)] opacity-50">
                  Jurisconsult
                </span>
              </div>
            </Link>

            <DesktopNav />

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--juris-surface-container)] text-[var(--juris-on-surface-variant)] hover:bg-[var(--juris-primary)] hover:text-white transition-all shadow-sm"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleMenu}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--juris-primary)] text-white shadow-lg shadow-juris-primary/20 transition-all hover:scale-110"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={openMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${openMenu ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={closeMenu} />
        <div className={`absolute bottom-0 inset-x-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-500 sm:p-8 sm:pb-[calc(2rem+env(safe-area-inset-bottom))] ${openMenu ? "translate-y-0" : "translate-y-full"}`}>
          <div className="w-12 h-1.5 bg-[var(--juris-surface-highest)] rounded-full mx-auto mb-6 opacity-20" />
          <div className="overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex flex-col items-center p-6 rounded-[2rem] transition-all ${
                    isActive(pathname, item.href)
                      ? "bg-[var(--juris-primary)] text-white shadow-xl shadow-juris-primary/20 scale-105"
                      : "bg-[var(--juris-surface-low)] text-[var(--juris-on-surface-variant)]"
                  }`}
                >
                  <div className="mb-3">
                    <CustomIcon icon={item.icon} className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {language === "ar" ? ARABIC_NAV_LABELS[item.key] : item.label.fr}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MOBILE_NAV_SECTIONS.map((section) => (
                <Link
                  key={section.key}
                  href={section.href}
                  onClick={closeMenu}
                  className={`flex items-center justify-between gap-3 rounded-[1.5rem] p-4 transition-all ${
                    isActive(pathname, section.href)
                      ? "bg-[var(--juris-primary)] text-white shadow-xl shadow-juris-primary/20"
                      : "bg-[var(--juris-surface-low)] text-[var(--juris-on-surface-variant)]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <CustomIcon icon={section.icon} className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {section.label[language as "fr" | "ar"]}
                    </span>
                  </span>
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DesktopNav() {
  const { language } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center space-x-1 overflow-x-hidden">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`group relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
            isActive(pathname, item.href)
              ? "bg-[var(--accent)] text-white shadow-md"
              : "text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          }`}
        >
          <CustomIcon icon={item.icon} className="h-4 w-4" />
          <span className="text-sm font-medium">{item.label[language as 'fr' | 'ar']}</span>
          {isActive(pathname, item.href) && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
          )}
        </Link>
      ))}
    </nav>
  );
}
